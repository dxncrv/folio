#!/usr/bin/env node

/**
 * pb:push — Push local PocketBase schema to deployed instance
 *
 * Usage:
 *   pnpm pb:push                          # uses POCKETBASE_PROD_URL from .env
 *   PB_PROD=https://pb.example.com pnpm pb:push  # override inline
 *
 * What it does:
 *   1. Exports local PB collections schema
 *   2. Generates a timestamped migration snapshot in pb/pb_migrations/
 *   3. Pushes the schema to the remote PB via PUT /api/collections/import
 *
 * Note: This uses "extend" mode (deleteMissing: false) by default.
 *       Pass --delete-missing to remove collections not present locally.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const PB_DIR = resolve(__dirname, '..');

const deleteMissing = process.argv.includes('--delete-missing');

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

const PROD_URL = process.env.PB_PROD || process.env.POCKETBASE_PROD_URL;
const PROD_EMAIL = process.env.PB_ADMIN_EMAIL;
const PROD_PASSWORD = process.env.PB_ADMIN_PASSWORD;
const LOCAL_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const LOCAL_EMAIL = process.env.PB_LOCAL_ADMIN_EMAIL || PROD_EMAIL;
const LOCAL_PASSWORD = process.env.PB_LOCAL_ADMIN_PASSWORD || PROD_PASSWORD;

if (!PROD_URL) {
	console.error('❌ Missing POCKETBASE_PROD_URL or PB_PROD env var');
	process.exit(1);
}

async function authAdmin(baseUrl, email, password) {
	const res = await fetch(`${baseUrl}/api/admins/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: email, password })
	});
	if (!res.ok) {
		const res2 = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ identity: email, password })
		});
		if (!res2.ok) throw new Error(`Auth failed on ${baseUrl}: ${res2.status} ${await res2.text()}`);
		return (await res2.json()).token;
	}
	return (await res.json()).token;
}

async function getCollections(baseUrl, token) {
	const res = await fetch(`${baseUrl}/api/collections?perPage=200`, {
		headers: { 'Authorization': token }
	});
	if (!res.ok) throw new Error(`Failed to fetch collections: ${res.status}`);
	const data = await res.json();
	return data.items || data;
}

async function importCollections(baseUrl, token, collections, delMissing = false) {
	const res = await fetch(`${baseUrl}/api/collections/import`, {
		method: 'PUT',
		headers: {
			'Authorization': token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ collections, deleteMissing: delMissing })
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Import failed: ${res.status} ${text}`);
	}
}

function generateMigration(collections) {
	const ts = Math.floor(Date.now() / 1000);
	const filename = `${ts}_collections_snapshot.js`;
	const schema = JSON.stringify(collections, null, 2);

	const content = `/// <reference path="../pb_data/types.d.ts" />

// Auto-generated collections snapshot — ${new Date().toISOString()}
migrate((app) => {
	const snapshot = ${schema};

	return app.importCollections(snapshot, false);
}, (app) => {
	// Revert not supported for snapshots — restore from backup if needed
	return null;
});
`;
	const path = resolve(PB_DIR, 'pb_migrations', filename);
	writeFileSync(path, content);
	return { filename, path };
}

async function main() {
	console.log(`\n🔄 PocketBase Schema Push`);
	console.log(`   Local:  ${LOCAL_URL}`);
	console.log(`   Remote: ${PROD_URL}`);
	if (deleteMissing) console.log('   ⚠️  --delete-missing enabled');
	console.log();

	// 1. Export local schema
	console.log('🔐 Authenticating on local...');
	const localToken = await authAdmin(LOCAL_URL, LOCAL_EMAIL, LOCAL_PASSWORD);

	console.log('📥 Fetching local collections schema...');
	const collections = await getCollections(LOCAL_URL, localToken);
	const importable = collections.filter(c => !c.system || c.name === '_superusers');
	console.log(`   Found ${collections.length} collections (${importable.length} importable)`);

	// 2. Save snapshot + migration
	const snapshotPath = resolve(PB_DIR, 'pb_schema.json');
	writeFileSync(snapshotPath, JSON.stringify(collections, null, 2));
	console.log('💾 Schema snapshot saved to pb/pb_schema.json');

	const { filename } = generateMigration(importable);
	console.log(`📝 Migration generated: pb/pb_migrations/${filename}`);

	// 3. Push to remote
	console.log('🔐 Authenticating on remote...');
	const remoteToken = await authAdmin(PROD_URL, PROD_EMAIL, PROD_PASSWORD);

	console.log('📤 Pushing schema to remote PocketBase...');
	await importCollections(PROD_URL, remoteToken, importable, deleteMissing);
	console.log('   ✅ Remote schema updated');

	console.log('\n✅ Push complete!\n');
}

main().catch(err => {
	console.error('❌ Push failed:', err.message);
	process.exit(1);
});
