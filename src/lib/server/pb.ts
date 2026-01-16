import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import type { TypedPocketBase } from '$lib/pocketbase-types';

// Use internal URL for server-side requests (Railway private networking)
// Falls back to localhost for local development
export const POCKETBASE_URL = env.POCKETBASE_INTERNAL_URL || 'http://127.0.0.1:8080';

console.log(`[PocketBase] Server-side client initialized with URL: ${POCKETBASE_URL}`);

export function createPBClient() {
    return new PocketBase(POCKETBASE_URL) as TypedPocketBase;
}
