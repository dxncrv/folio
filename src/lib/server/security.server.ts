import { env } from '$env/dynamic/private';

// IP whitelist for admin dashboard
const BASE_WHITELISTED_IPS = [
    '127.0.0.1',        // localhost
    '::1',              // IPv6 localhost
];

/**
 * Checks if the given IP is whitelisted
 */
export const isIPWhitelisted = (ip: string): boolean => {
    const ADMIN_IP = env.ADMIN_IP ?? '';
    if (process.env.NODE_ENV === 'development') {
        console.log(`Checking IP: ${ip} against whitelist:`, [...BASE_WHITELISTED_IPS, ...(ADMIN_IP ? [ADMIN_IP] : [])]);
    }
    return [...BASE_WHITELISTED_IPS, ...(ADMIN_IP ? [ADMIN_IP] : [])].includes(ip);
};

/**
 * Minimal write guard: accepts either the `x-admin-token` header OR an HttpOnly cookie named `admin_token`.
 * Returns true when the request is authorized to perform write operations.
 */
export async function isAuthorizedWrite(request: Request): Promise<boolean> {
    const headers = request.headers;
    const tokenHeader = headers.get('x-admin-token') ?? '';
    const ADMIN_TOKEN = env.ADMIN_TOKEN ?? '';

    // Header check (existing behavior)
    if (ADMIN_TOKEN && tokenHeader && tokenHeader === ADMIN_TOKEN) return true;

    // Cookie check: parse `cookie` header for `admin_token` (now a session token)
    const cookieHeader = headers.get('cookie') ?? '';
    const match = cookieHeader.match(/(?:^|; )admin_token=([^;]+)/);
    const sessionToken = match ? match[1] : null;

    if (sessionToken) {
        try {
            const { RedisStore } = await import('$lib/server/redis.server');
            const stored = await RedisStore.getAdminSession(sessionToken);
            // stored holds the admin token (if session valid)
            if (stored && ADMIN_TOKEN && stored === ADMIN_TOKEN) return true;
        } catch (err) {
            console.error('Session validation error', err);
            return false;
        }
    }

    return false;
}

export {};
