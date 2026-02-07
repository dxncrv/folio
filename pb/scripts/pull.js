#!/usr/bin/env node

/**
 * pb:pull — Pull deployed PocketBase schema into local dev environment
 *
 * Usage:
 *   pnpm pb:pull                          # uses POCKETBASE_PROD_URL from .env
 *   PB_PROD=https://pb.example.com pnpm pb:pull  # override inline
 *
 * What it does:
 *   1. Authenticates as admin on the REMOTE (deployed) PB instance
 *   2. Exports all collections schema via GET /api/collections
 *   3. Imports that schema into the LOCAL PB instance via PUT /api/collections/import
 *   4. Writes the schema snapshot to pb/pb_schema.json for reference
 */

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const PB_DIR = resolve(__dirname, '..');

// Load .env if present
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
	} catch {
		// No .env file, rely on env vars
	}
}

loadEnv();

const PROD_URL = process.env.PB_PROD || process.env.POCKETBASE_PROD_URL;
const PROD_EMAIL = process.env.PB_ADMIN_EMAIL;
const PROD_PASSWORD = process.env.PB_ADMIN_PASSWORD;
const LOCAL_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const LOCAL_EMAIL = process.env.PB_LOCAL_ADMIN_EMAIL || PROD_EMAIL;
const LOCAL_PASSWORD = process.env.PB_LOCAL_ADMIN_PASSWORD || PROD_PASSWORD;

if (!PROD_URL) {
	console.error('❌ Missing POCKETBASE_PROD_URL or PB_PROD env var');
	console.error('   Set it in .env or pass inline: PB_PROD=https://... pnpm pb:pull');
	process.exit(1);
}

if (!PROD_EMAIL || !PROD_PASSWORD) {
	console.error('❌ Missing PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD env vars');
	process.exit(1);
}

async function authAdmin(baseUrl, email, password) {
	const res = await fetch(`${baseUrl}/api/admins/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: email, password })
	});
	if (!res.ok) {
		// Try superuser collection auth (PB 0.23+)
		const res2 = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ identity: email, password })
		});
		if (!res2.ok) {
			throw new Error(`Auth failed on ${baseUrl}: ${res2.status} ${await res2.text()}`);
		}
		const data = await res2.json();
		return data.token;
	}
	const data = await res.json();
	return data.token;
}

async function getCollections(baseUrl, token) {
	const res = await fetch(`${baseUrl}/api/collections?perPage=200`, {
		headers: { 'Authorization': token }
	});
	if (!res.ok) throw new Error(`Failed to fetch collections: ${res.status}`);
	const data = await res.json();
	return data.items || data;
}

async function importCollections(baseUrl, token, collections) {
	const res = await fetch(`${baseUrl}/api/collections/import`, {
		method: 'PUT',
		headers: {
			'Authorization': token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ collections, deleteMissing: false })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to import collections: ${res.status} ${text}`);
	}
}

async function main() {
	console.log(`\n🔄 PocketBase Schema Pull`);
	console.log(`   Remote: ${PROD_URL}`);
	console.log(`   Local:  ${LOCAL_URL}\n`);

	// 1. Auth on remote
	console.log('🔐 Authenticating on remote...');
	const remoteToken = await authAdmin(PROD_URL, PROD_EMAIL, PROD_PASSWORD);
	console.log('   ✅ Remote auth successful');

	// 2. Export remote collections
	console.log('📥 Fetching remote collections schema...');
	const collections = await getCollections(PROD_URL, remoteToken);
	// Filter out system collections that shouldn't be imported
	const importable = collections.filter(c => !c.system || c.name === '_superusers');
	console.log(`   Found ${collections.length} collections (${importable.length} importable)`);

	// 3. Save snapshot
	const snapshotPath = resolve(PB_DIR, 'pb_schema.json');
	writeFileSync(snapshotPath, JSON.stringify(collections, null, 2));
	console.log(`💾 Schema snapshot saved to pb/pb_schema.json`);

	// 4. Import into local
	console.log('🔐 Authenticating on local...');
	try {
		const localToken = await authAdmin(LOCAL_URL, LOCAL_EMAIL, LOCAL_PASSWORD);
		console.log('   ✅ Local auth successful');

		console.log('📤 Importing schema into local PocketBase...');
		await importCollections(LOCAL_URL, localToken, importable);
		console.log('   ✅ Local schema updated');
	} catch (err) {
		console.warn(`⚠️  Could not import to local PB (is it running on ${LOCAL_URL}?)`);
		console.warn(`   ${err.message}`);
		console.log('   Schema snapshot was still saved — you can import manually via the PB Admin UI.');
	}

	console.log('\n✅ Pull complete!\n');
}

main().catch(err => {
	console.error('❌ Pull failed:', err.message);
	process.exit(1);
});
