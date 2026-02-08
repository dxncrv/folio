import { json, type RequestHandler, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { TypedPocketBase } from '$lib/pocketbase-types';

// Cached superuser token to avoid re-authenticating on every write request
let cachedSuperuserToken: string | null = null;
let tokenExpiresAt = 0;

// Small helper to return JSON with status
export function respondJson(data: unknown, status = 200) {
    return json(data, { status });
}

/**
 * Authenticate the PB client as superuser so PB collection rules pass.
 * Caches the token in memory (~24h) to avoid re-authenticating per request.
 */
async function authenticateSuperuser(pb: TypedPocketBase): Promise<void> {
    const email = env.PB_ADMIN_EMAIL;
    const password = env.PB_ADMIN_PASSWORD;

    if (!email || !password) {
        console.warn('[withAdmin] PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD not set — PB writes may fail due to collection rules');
        return;
    }

    // Reuse cached token if still valid (with 5-min buffer)
    if (cachedSuperuserToken && Date.now() < tokenExpiresAt - 300_000) {
        pb.authStore.save(cachedSuperuserToken);
        return;
    }

    try {
        const authData = await pb.collection('_superusers').authWithPassword(email, password);
        cachedSuperuserToken = authData.token;
        // PB superuser tokens last 24h by default
        tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
    } catch (err) {
        console.error('[withAdmin] Superuser auth failed:', err);
    }
}

// Utility to normalize thrown errors into json responses. If thrown error message contains
// 'not found' return 404, otherwise 500.
export async function normalizeHandlerResults<T>(fn: () => Promise<T>, notFoundMatcher = /not found/i): Promise<Response> {
    try {
        const v = await fn();

        // If handler returned a Response (SvelteKit or fetch Response), pass it through unchanged.
    // If handler returned a Response, pass it through unchanged.
    if (typeof Response !== 'undefined' && v instanceof Response) return v as Response;

        // If handler returned an explicit shape with { body, status }, respect the status
        if (v && typeof v === 'object' && typeof (v as any).status === 'number' && 'body' in (v as any)) {
            return json((v as any).body, { status: (v as any).status });
        }

        // Default: wrap value as JSON 200
        return respondJson(v);
    } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));

        // If caller threw an object with a numeric status, forward that status and message
        if ((e as any) && typeof (e as any).status === 'number') {
            const message = (e as any).message || err.message || 'Error';
            return json({ error: message }, { status: (e as any).status });
        }

        if (notFoundMatcher.test(err.message)) return json({ error: err.message }, { status: 404 });
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper to create a RequestHandler that normalizes errors for any handler that returns data
export function withHandler(fn: (event: RequestEvent) => Promise<any>): RequestHandler {
    return async (event) => await normalizeHandlerResults(() => fn(event));
}

// Helper to create a RequestHandler that enforces admin session and authenticates PB as superuser
export function withAdmin(fn: (event: RequestEvent) => Promise<any>): RequestHandler {
    return async (event) => {
        // Check admin_session cookie set by /start/login
        const session = event.cookies?.get('admin_session');
        
        if (session !== 'authenticated') {
            return json({ error: 'Forbidden' }, { status: 403 });
        }

        // Authenticate PB client as superuser so collection write rules pass
        await authenticateSuperuser(event.locals.pb);

        return await normalizeHandlerResults(() => fn(event));
    };
}
