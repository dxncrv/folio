import { json, type RequestHandler } from '@sveltejs/kit';

// Small helper to return JSON with status
export function respondJson(data: unknown, status = 200) {
    return json(data, { status });
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
export function withHandler(fn: (event: any) => Promise<any>): RequestHandler {
    return async (event: any) => await normalizeHandlerResults(() => fn(event));
}

// Helper to create a RequestHandler that enforces admin write auth before running handler
export function withAdmin(fn: (event: any) => Promise<any>): RequestHandler {
    return async (event: any) => {
        // Check admin_session cookie set by /start/login
        const session = event.cookies?.get('admin_session');
        
        if (session !== 'authenticated') {
            return json({ error: 'Forbidden' }, { status: 403 });
        }
        return await normalizeHandlerResults(() => fn(event));
    };
}

export default { respondJson, normalizeHandlerResults, withHandler, withAdmin };
