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

export function createPBClient() {
    const pb = new PocketBase(POCKETBASE_URL) as TypedPocketBase;
    
    // Recovery Strategy: Handle cold-starts/network blips by retrying with exponential backoff.
    // Railway free tier can take 5–20s to wake PocketBase — we need to survive that window.
    pb.beforeSend = function (url, options) {
        // Only retry GET requests (idempotent) to avoid side effects
        if (options.method === 'GET') {
            options.fetch = async (input, init) => {
                // 4 attempts: waits up to ~8s per attempt + 2s/4s/6s between = ~30s ceiling
                const maxRetries = 4;
                // Delay between retries: 2s, 4s, 6s
                const retryDelays = [2000, 4000, 6000];
                let lastError;

                for (let i = 0; i < maxRetries; i++) {
                    // Bail immediately if the parent SvelteKit request was cancelled
                    if (init?.signal?.aborted) throw init.signal.reason ?? new Error('Request aborted');

                    try {
                        // 8s timeout per attempt prevents indefinite hangs on a sleeping server
                        const timeoutSignal = AbortSignal.timeout(8000);
                        const signal = init?.signal
                            ? (typeof AbortSignal.any === 'function'
                                ? AbortSignal.any([init.signal, timeoutSignal])
                                : timeoutSignal)
                            : timeoutSignal;

                        const response = await fetch(input, { ...init, signal });
                        if (response.ok || response.status < 500) return response;
                        throw new Error(`Server returned ${response.status}`);
                    } catch (err) {
                        lastError = err;
                        // Stop retrying if the parent request was cancelled
                        if (init?.signal?.aborted) throw init.signal.reason ?? err;

                        if (i < maxRetries - 1) {
                            const delay = retryDelays[i];
                            console.warn(`[PocketBase] Attempt ${i + 1}/${maxRetries} failed, retrying in ${delay}ms...`);
                            await new Promise(r => setTimeout(r, delay));
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
