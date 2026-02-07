import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { TypedPocketBase } from '$lib/pocketbase-types';

// Use internal URL for server-side requests (Railway private networking)
// Priority: POCKETBASE_INTERNAL_URL > POCKETBASE_URL > Localhost:8090
let internalUrl = env.POCKETBASE_INTERNAL_URL || env.POCKETBASE_URL || 'http://127.0.0.1:8090';

// Ensure the URL has a protocol scheme
if (internalUrl && !internalUrl.startsWith('http')) {
    internalUrl = `http://${internalUrl}`;
}

export const POCKETBASE_URL = internalUrl;

// Public URL for browser-side links (Dashboard, etc.)
// Always use PUBLIC_POCKETBASE_URL for public access, never fall back to internal URL
export const POCKETBASE_PUBLIC_URL = publicEnv.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

console.log(`[PocketBase] Server-side client initialized with URL: ${POCKETBASE_URL}`);

export function createPBClient() {
    const pb = new PocketBase(POCKETBASE_URL) as TypedPocketBase;
    
    // Recovery Strategy: Handle cold-starts/network blips by retrying once with a slight delay
    // This is vital for Free Tier hosting (like Railway) where the backend may be sleeping.
    pb.beforeSend = function (url, options) {
        // Only retry GET requests (idempotent) to avoid side effects
        if (options.method === 'GET') {
            options.fetch = async (input, init) => {
                const maxRetries = 2;
                let lastError;
                
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        const response = await fetch(input, init);
                        // If it's a 5xx error or connection issue, it might be the server spinning up
                        if (response.ok || response.status < 500) return response;
                        throw new Error(`Server returned ${response.status}`);
                    } catch (err) {
                        lastError = err;
                        console.warn(`[PocketBase] Fetch attempt ${i + 1} failed, retrying...`, err);
                        if (i < maxRetries - 1) {
                            // Exponential backoff: 500ms, then 1500ms
                            await new Promise(r => setTimeout(r, 500 * (i + 1))); 
                        }
                    }
                }
                throw lastError;
            };
        }
        return { url, options };
    };

    return pb;
}
