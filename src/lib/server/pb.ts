import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import type { TypedPocketBase } from '$lib/pocketbase-types';

export const POCKETBASE_URL = env.POCKETBASE_URL || 'http://127.0.0.1:8090';

export function createPBClient() {
    return new PocketBase(POCKETBASE_URL) as TypedPocketBase;
}
