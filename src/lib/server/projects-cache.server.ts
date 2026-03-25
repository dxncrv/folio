import type { RecordModel } from 'pocketbase';

// Module-level cache persists across requests within the same Node.js process.
// Cache hit = sub-millisecond response; no PocketBase round-trip required.
const TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedData: RecordModel[] | null = null;
let expiresAt = 0;

export function getCachedProjects(): RecordModel[] | null {
    if (cachedData && Date.now() < expiresAt) return cachedData;
    cachedData = null;
    return null;
}

export function setCachedProjects(data: RecordModel[]): void {
    cachedData = data;
    expiresAt = Date.now() + TTL_MS;
}

export function invalidateProjectsCache(): void {
    cachedData = null;
}
