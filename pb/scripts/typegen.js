#!/usr/bin/env node

/**
 * pb:typegen — Generate TypeScript types from local PocketBase schema
 *
 * Usage:
 *   pnpm pb:typegen              # generates from local PB instance
 *   pnpm pb:typegen --from-file  # generates from pb/pb_schema.json snapshot
 *
 * Outputs to: src/lib/pocketbase-types.ts
 */

import PocketBase from 'pocketbase';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const PB_DIR = resolve(__dirname, '..');
const OUTPUT = resolve(ROOT, 'src', 'lib', 'pocketbase-types.ts');
const fromFile = process.argv.includes('--from-file');

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
const ADMIN_EMAIL = process.env.PB_LOCAL_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_LOCAL_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;

async function fetchCollections(url, email, password) {
	const pb = new PocketBase(url);
	pb.autoCancellation(false);
	console.log(`🔐 Authenticating on ${url}...`);
	await pb.collection('_superusers').authWithPassword(email, password);
	console.log('📥 Fetching collections schema...');
	return await pb.collections.getFullList();
}

/** Map PocketBase field types to TypeScript types */
function pbTypeToTS(field) {
	switch (field.type) {
		case 'text':
		case 'editor':
		case 'email':
		case 'url':
			return 'string';
		case 'number':
			return 'number';
		case 'bool':
			return 'boolean';
		case 'date':
		case 'autodate':
			return 'string';
		case 'select':
			return field.options?.maxSelect === 1 ? 'string' : 'string[]';
		case 'file':
			return field.options?.maxSelect === 1 ? 'string' : 'string[]';
		case 'relation':
			return field.options?.maxSelect === 1 ? 'string' : 'string[]';
		case 'json':
			return 'unknown';
		default:
			return 'unknown';
	}
}

function pascalCase(str) {
	return str.replace(/(^|[-_ ])(\w)/g, (_, __, c) => c.toUpperCase());
}

function generateTypes(collections) {
	const userCollections = collections.filter(c =>
		!c.system || c.name === '_superusers'
	);

	let out = `/**
 * Auto-generated PocketBase types — ${new Date().toISOString()}
 * Do not edit manually. Regenerate with: pnpm pb:typegen
 */

import PocketBase, { type RecordService, type RecordModel } from 'pocketbase';

// Base system fields that all records have
interface BaseSystemFields {
\tid: string;
\tcollectionId: string;
\tcollectionName: string;
\tcreated: string;
\tupdated: string;
}\n\n`;

	const recordNames = [];

	for (const col of userCollections) {
		const name = pascalCase(col.name) + 'Record';
		recordNames.push({ name, collectionName: col.name });

		const fields = (col.fields || col.schema || [])
			.filter(f => !['id', 'created', 'updated', 'collectionId', 'collectionName'].includes(f.name));

		out += `export interface ${name} extends BaseSystemFields, RecordModel {\n`;
		for (const f of fields) {
			const tsType = pbTypeToTS(f);
			const optional = f.required ? '' : '?';
			out += `\t${f.name}${optional}: ${tsType};\n`;
		}
		out += `}\n\n`;
	}

	// Generate TypedPocketBase interface
	out += `export interface TypedPocketBase extends PocketBase {\n`;
	for (const { name, collectionName } of recordNames) {
		out += `\tcollection(idOrName: '${collectionName}'): RecordService<${name}>;\n`;
	}
	out += `\tcollection<T = RecordModel>(idOrName: string): RecordService<T>;\n`;
	out += `}\n`;

	return out;
}

async function main() {
	let collections;

	if (fromFile) {
		const schemaPath = resolve(PB_DIR, 'pb_schema.json');
		console.log(`📂 Reading schema from pb/pb_schema.json...`);
		try {
			collections = JSON.parse(readFileSync(schemaPath, 'utf-8'));
		} catch {
			console.error('❌ Could not read pb/pb_schema.json — run pnpm pb:pull first');
			process.exit(1);
		}
	} else {
		if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
			console.error('❌ Missing PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD (or PB_LOCAL_ADMIN_*)');
			process.exit(1);
		}
		collections = await fetchCollections(LOCAL_URL, ADMIN_EMAIL, ADMIN_PASSWORD);
	}

	console.log(`⚙️  Generating types for ${collections.length} collections...`);
	const types = generateTypes(collections);
	writeFileSync(OUTPUT, types);
	console.log(`✅ Types written to src/lib/pocketbase-types.ts\n`);
}

main().catch(err => {
	console.error('❌ Typegen failed:', err.message);
	process.exit(1);
});
