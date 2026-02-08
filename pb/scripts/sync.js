#!/usr/bin/env node

/**
 * pb:sync — Sync schema + data between local and remote PocketBase
 *
 * Usage:
 *   pnpm pb:pull                         # remote → local (schema + data)
 *   pnpm pb:push                         # local → remote (schema + data)
 *   pnpm pb:pull --schema-only           # schema only, skip records
 *   pnpm pb:push --clean                 # also delete orphaned records on target
 *
 * Superuser auth is NEVER synced — each instance keeps its own credentials.
 * Set separate credentials with PB_LOCAL_ADMIN_EMAIL/PASSWORD and PB_REMOTE_ADMIN_EMAIL/PASSWORD.
 *
 * Env vars (.env):
 *   POCKETBASE_URL            Local PB URL (default: http://127.0.0.1:8090)
 *   POCKETBASE_PROD_URL       Remote PB URL (required)
 *   PB_ADMIN_EMAIL/PASSWORD   Shared admin creds (fallback for both)
 *   PB_LOCAL_ADMIN_EMAIL/PASSWORD   Local-specific creds (optional override)
 *   PB_REMOTE_ADMIN_EMAIL/PASSWORD  Remote-specific creds (optional override)
 */

import PocketBase from 'pocketbase';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const PB_DIR = resolve(__dirname, '..');

// ── Args ─────────────────────────────────────────────────────────────────────

const DIRECTION = process.argv[2]; // 'pull' or 'push'
const SCHEMA_ONLY = process.argv.includes('--schema-only');
const CLEAN = process.argv.includes('--clean');

// Auth system collections — never touch during sync
const SYSTEM_SKIP = new Set([
	'_superusers', '_mfas', '_otps', '_externalAuths', '_authOrigins'
]);

// ── Env ──────────────────────────────────────────────────────────────────────

function loadEnv() {
	try {
		const content = readFileSync(resolve(ROOT, '.env'), 'utf-8');
		for (const line of content.split('\n')) {
			const t = line.trim();
			if (!t || t.startsWith('#')) continue;
			const eq = t.indexOf('=');
			if (eq === -1) continue;
			const k = t.slice(0, eq).trim();
			const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
			if (!process.env[k]) process.env[k] = v;
		}
	} catch { /* no .env */ }
}

loadEnv();

const LOCAL_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const REMOTE_URL = process.env.POCKETBASE_PROD_URL;
const LOCAL_EMAIL = process.env.PB_LOCAL_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
const LOCAL_PASSWORD = process.env.PB_LOCAL_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;
const REMOTE_EMAIL = process.env.PB_REMOTE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
const REMOTE_PASSWORD = process.env.PB_REMOTE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;

// ── Validate ─────────────────────────────────────────────────────────────────

if (!['push', 'pull'].includes(DIRECTION)) {
	console.error('Usage: pnpm pb:sync [pull|push] [--schema-only] [--clean]');
	process.exit(1);
}
if (!REMOTE_URL) {
	console.error('❌ Set POCKETBASE_PROD_URL in .env');
	process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function authenticate(pb, label, email, password) {
	if (!email || !password) throw new Error(`Missing credentials for ${label}`);
	console.log(`🔐 ${label}...`);
	await pb.collection('_superusers').authWithPassword(email, password);
}

/** Return file-type field names for a collection */
function fileFieldNames(collection) {
	return (collection.fields || collection.schema || [])
		.filter(f => f.type === 'file')
		.map(f => f.name);
}

/** Download a single file blob from a PB instance */
async function downloadFile(pb, record, filename) {
	try {
		const token = await pb.files.getToken();
		const url = pb.files.getURL(record, filename, { token });
		const res = await fetch(url);
		if (!res.ok) return null;
		return new Blob([await res.arrayBuffer()]);
	} catch {
		return null;
	}
}

// ── Schema Sync ──────────────────────────────────────────────────────────────

async function syncSchema(sourcePB, targetPB) {
	console.log('\n📋 Syncing schema...');

	const allCollections = await sourcePB.collections.getFullList();

	// Strip auth system collections — superuser creds stay independent
	const importable = allCollections.filter(c => !SYSTEM_SKIP.has(c.name));

	// Save snapshot for reference / typegen --from-file
	writeFileSync(
		resolve(PB_DIR, 'pb_schema.json'),
		JSON.stringify(allCollections, null, 2)
	);

	// Import to target (deleteMissing: false → extend mode, never drops tables)
	await targetPB.collections.import(importable, false);
	console.log(`   ✅ ${importable.length} collections synced (snapshot saved)`);

	return allCollections;
}

// ── Record Sync ──────────────────────────────────────────────────────────────

async function syncRecords(sourcePB, targetPB, collections) {
	console.log('\n📦 Syncing records...');

	// Only sync non-system user collections
	const userCollections = collections.filter(c => !c.system);
	if (!userCollections.length) {
		console.log('   No user collections to sync.');
		return;
	}

	for (const col of userCollections) {
		const name = col.name;
		const fileFields = fileFieldNames(col);

		// Fetch all source records
		let sourceRecords;
		try {
			sourceRecords = await sourcePB.collection(name).getFullList({ sort: 'created', batch: 500 });
		} catch (e) {
			console.warn(`   ⚠️  ${name}: ${e.message}`);
			continue;
		}

		let created = 0, updated = 0, failed = 0;

		for (const record of sourceRecords) {
			try {
				// Strip system fields, keep everything else
				const {
					id, collectionId, collectionName,
					created: _c, updated: _u, expand,
					...data
				} = record;

				// For file fields: download from source, attach as Blob
				const hasFiles = fileFields.some(f => {
					const v = record[f];
					return v && (Array.isArray(v) ? v.length > 0 : true);
				});

				let payload;
				if (hasFiles) {
					payload = new FormData();
					for (const [key, val] of Object.entries(data)) {
						if (fileFields.includes(key)) {
							const names = Array.isArray(val) ? val : val ? [val] : [];
							for (const fname of names) {
								const blob = await downloadFile(sourcePB, record, fname);
								if (blob) payload.append(key, blob, fname);
							}
						} else if (val !== null && val !== undefined) {
							payload.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
						}
					}
				} else {
					payload = data;
				}

				// Upsert: try update first, create with same ID if 404
				try {
					await targetPB.collection(name).update(id, payload);
					updated++;
				} catch (e) {
					if (e.status === 404) {
						if (payload instanceof FormData) {
							payload.append('id', id);
						} else {
							payload = { ...payload, id };
						}
						await targetPB.collection(name).create(payload);
						created++;
					} else {
						throw e;
					}
				}
			} catch (e) {
				failed++;
				if (process.argv.includes('--verbose')) {
					console.warn(`      ${name}/${record.id}: ${e.message}`);
				}
			}
		}

		// --clean: remove target records that don't exist in source
		if (CLEAN) {
			try {
				const sourceIds = new Set(sourceRecords.map(r => r.id));
				const targetRecords = await targetPB.collection(name).getFullList({ fields: 'id', batch: 500 });
				let deleted = 0;
				for (const tr of targetRecords) {
					if (!sourceIds.has(tr.id)) {
						await targetPB.collection(name).delete(tr.id);
						deleted++;
					}
				}
				if (deleted) console.log(`   ${name}: ${deleted} orphaned records removed`);
			} catch { /* collection might be empty or inaccessible */ }
		}

		const stats = [
			sourceRecords.length + ' total',
			created && `${created} created`,
			updated && `${updated} updated`,
			failed && `${failed} failed`
		].filter(Boolean).join(', ');

		console.log(`   ${name}: ${stats}`);
	}
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	const isPull = DIRECTION === 'pull';
	const sourceUrl = isPull ? REMOTE_URL : LOCAL_URL;
	const targetUrl = isPull ? LOCAL_URL : REMOTE_URL;

	console.log(`\n🔄 pb:sync ${DIRECTION}`);
	console.log(`   ${isPull ? 'Remote → Local' : 'Local → Remote'}`);
	console.log(`   Source: ${sourceUrl}`);
	console.log(`   Target: ${targetUrl}`);
	if (SCHEMA_ONLY) console.log('   --schema-only');
	if (CLEAN) console.log('   --clean');

	const source = new PocketBase(sourceUrl);
	const target = new PocketBase(targetUrl);
	source.autoCancellation(false);
	target.autoCancellation(false);

	await authenticate(
		source,
		`Source (${isPull ? 'remote' : 'local'})`,
		isPull ? REMOTE_EMAIL : LOCAL_EMAIL,
		isPull ? REMOTE_PASSWORD : LOCAL_PASSWORD
	);
	await authenticate(
		target,
		`Target (${isPull ? 'local' : 'remote'})`,
		isPull ? LOCAL_EMAIL : REMOTE_EMAIL,
		isPull ? LOCAL_PASSWORD : REMOTE_PASSWORD
	);

	const collections = await syncSchema(source, target);

	if (!SCHEMA_ONLY) {
		await syncRecords(source, target, collections);
	}

	console.log('\n✅ Done!\n');
}

main().catch(e => {
	console.error(`\n❌ ${e.message}`);
	process.exit(1);
});
