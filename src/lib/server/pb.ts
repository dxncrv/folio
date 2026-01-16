import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import type { TypedPocketBase } from '$lib/pocketbase-types';

// Use internal URL for server-side requests (Railway private networking)
// Falls back to localhost for local development
let internalUrl = env.POCKETBASE_INTERNAL_URL || 'http://127.0.0.1:8080';

// Ensure the URL has a protocol scheme
if (internalUrl && !internalUrl.startsWith('http')) {
    internalUrl = `http://${internalUrl}`;
}

export const POCKETBASE_URL = internalUrl;

// Public URL for browser-side links (Dashboard, etc.)
export const POCKETBASE_PUBLIC_URL = env.PUBLIC_POCKETBASE_URL || POCKETBASE_URL;

console.log(`[PocketBase] Server-side client initialized with URL: ${POCKETBASE_URL}`);

export function createPBClient() {
    return new PocketBase(POCKETBASE_URL) as TypedPocketBase;
}
