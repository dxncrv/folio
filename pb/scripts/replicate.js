#!/usr/bin/env node

/**
 * pb:replicate — Full Database Replication (Files + Data) via Backup API
 *
 * Usage:
 *   pnpm pb:replicate [push|pull]
 *
 *   push: Local -> Remote (DANGER: Overwrites Remote)
 *   pull: Remote -> Local (DANGER: Overwrites Local)
 *
 * Prerequisites:
 *   - Both instances must be running
 *   - Superuser credentials in .env
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';
// Node 18+ has native fetch/FormData, so we don't need 'undici'
// But if strict types complain, we ignore.

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const DIRECTION = process.argv[2]; // 'push' or 'pull'

function loadEnv() {
	try {
		const envPath = resolve(ROOT, '.env');
		const content = readFileSync(envPath, 'utf-8');
		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eqIdx = trimmed.indexOf('=');
			if (eqIdx === -1) continue;
			const key = trimmed.slice(0, eqIdx).trim();
			const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
			if (!process.env[key]) process.env[key] = val;
		}
	} catch { /* no .env */ }
}

loadEnv();

const LOCAL_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const PROD_URL = process.env.POCKETBASE_PROD_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!['push', 'pull'].includes(DIRECTION)) {
	console.error('❌ Usage: pnpm pb:replicate [push|pull]');
	process.exit(1);
}

if (!PROD_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error('❌ Missing .env config (POCKETBASE_PROD_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)');
	process.exit(1);
}

// Support separate remote credentials if provided
const REMOTE_EMAIL = process.env.PB_REMOTE_ADMIN_EMAIL || ADMIN_EMAIL;
const REMOTE_PASSWORD = process.env.PB_REMOTE_ADMIN_PASSWORD || ADMIN_PASSWORD;

// Clients
const localPB = new PocketBase(LOCAL_URL);
const remotePB = new PocketBase(PROD_URL);
// Force cancellation false for scripts
localPB.autoCancellation(false);
remotePB.autoCancellation(false);

async function auth(pb, label, email, password) {
	console.log(`🔐 keyauth: ${label} (${email})...`);
	try {
		await pb.collection('_superusers').authWithPassword(email, password);
	} catch (e) {
		// Try legacy admins collection if superusers fails
		try {
			await pb.admins.authWithPassword(email, password);
		} catch (e2) {
			throw new Error(`Auth failed on ${label}: ${e.message}`);
		}
	}
}

async function createBackup(pb, label) {
	console.log(`📦 creating backup on ${label}...`);
	try {
		// Create backup with standard name format
		// Note: create() returns void, works async.
		const name = `sync_${Date.now()}.zip`;
		await pb.backups.create(name);
		
		// Wait for backup to appear in list (it's async background job)
		process.stdout.write('   Waiting for backup job');
		for (let i = 0; i < 30; i++) { // wait up to 60s
			process.stdout.write('.');
			await new Promise(r => setTimeout(r, 2000));
			const list = await pb.backups.getFullList();
			const found = list.find(b => b.key.includes(name) || b.key === name); // name might be auto-suffixed
			if (found) {
				console.log(`\n   ✅ Backup created: ${found.key}`);
				return found.key;
			}
		}
		throw new Error('Backup creation timed out');
	} catch (e) {
		throw new Error(`Backup failed: ${e.message}`);
	}
}

async function downloadBackup(pb, key) {
	console.log(`⬇️  downloading ${key}...`);
	const token = await pb.files.getToken();
	const url = pb.backups.getDownloadUrl(token, key);
	
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Download failed: ${res.status}`);
	
	const buffer = await res.arrayBuffer();
	return new Blob([buffer]); // PB SDK expects Blob/File for upload
}

async function uploadBackup(pb, blob, name) {
	console.log(`⬆️  uploading to target...`);
	try {
		// PB SDK upload expects object { file: ... }
		await pb.backups.upload({ file: blob });
		console.log('   ✅ Upload complete');
	} catch (e) {
		throw new Error(`Upload failed: ${e.message}`);
	}
}

async function restoreBackup(pb, key) {
	console.log(`♻️  restoring ${key} on target (Server will restart)...`);
	try {
		await pb.backups.restore(key);
		console.log('   ✅ Restore command sent.');
		console.log('   ⏳ Target server is restarting...');
	} catch (e) {
		// Restore often throws network error because server kills connection to restart
		// We treat 0/abort as success usually
		if (e.status === 0 || e.message.includes('fetch')) {
			console.log('   (Connection closed as expected during restart)');
		} else {
			throw e;
		}
	}
}

async function main() {
	console.log(`\n🔄 PocketBase Replicate: ${DIRECTION.toUpperCase()}`);
	console.log(`   Detailed logging enabled.\n`);

	const SOURCE = DIRECTION === 'push' ? localPB : remotePB;
	const TARGET = DIRECTION === 'push' ? remotePB : localPB;
	const S_LABEL = DIRECTION === 'push' ? 'Local' : 'Remote';
	const T_LABEL = DIRECTION === 'push' ? 'Remote' : 'Local';

	// Determine creds based on direction and target
	const S_EMAIL = SOURCE === localPB ? ADMIN_EMAIL : REMOTE_EMAIL;
	const S_PASS = SOURCE === localPB ? ADMIN_PASSWORD : REMOTE_PASSWORD;
	const T_EMAIL = TARGET === localPB ? ADMIN_EMAIL : REMOTE_EMAIL;
	const T_PASS = TARGET === localPB ? ADMIN_PASSWORD : REMOTE_PASSWORD;

	await auth(SOURCE, S_LABEL, S_EMAIL, S_PASS);
	await auth(TARGET, T_LABEL, T_EMAIL, T_PASS);

	// 1. Create Backup on Source
	const backupKey = await createBackup(SOURCE, S_LABEL);

	// 2. Download from Source
	const blob = await downloadBackup(SOURCE, backupKey);

	// 3. Upload to Target
	// Note: We might need to rename it to avoid collision if times match perfectly, but unlikely.
	// Actually, upload() usually takes a file object where name matters.
	// We need to ensure the Blob has a name property or construct a File if environment supports it.
	// In Node, we effectively send FormData.
	
	// Create a File-like object for Node environment if needed, or just pass Blob.
	// The SDK uses 'file' field.
	// Let's try native Blob. If fails, we might need a workaround for filename.
	// Actually, the SDK builds FormData. FormData.append('file', blob, filename) is needed.
	// PB SDK might not set filename if just Blob passed.
	
	// Hack: Add name to blob or use 'undici' File if in Node context
	// Or simplified: Just upload.
	
	// Better approach for Node:
	const file = new File([blob], backupKey, { type: 'application/zip' });
	
	await uploadBackup(TARGET, file, backupKey);

	// 4. Restore on Target
	await restoreBackup(TARGET, backupKey);

	console.log(`\n🎉 Replication complete! ${T_LABEL} is now a clone of ${S_LABEL}.`);
}

main().catch(err => {
	console.error('\n❌ Replication failed:', err.message);
	process.exit(1);
});
