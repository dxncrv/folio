import { env } from '$env/dynamic/private';
import { isIPWhitelisted } from './whitelist.server';

/**
 * Return true when the incoming request is authorized for admin actions.
 * Checks, in order:
 *  - x-admin-token header matches ADMIN_TOKEN (if set)
 *  - request IP is whitelisted (x-forwarded-for, x-real-ip)
 */
export const isAdminRequest = (request: Request): boolean => {
    const headers = request.headers;
    const token = headers.get('x-admin-token') ?? '';
    const ADMIN_TOKEN = env.ADMIN_TOKEN;

    // Check for admin_session cookie set by hooks.server when a whitelisted IP visited /start
    const cookieHeader = headers.get('cookie') ?? '';
    if (cookieHeader.split(';').map(s => s.trim()).includes('admin_session=1')) {
        return true;
    }

    if (ADMIN_TOKEN && token && token === ADMIN_TOKEN) {
        return true;
    }

    const xff = headers.get('x-forwarded-for') ?? '';
    const xrip = headers.get('x-real-ip') ?? '';
    const clientIP = (xff.split(',')[0].trim() || xrip.trim() || '').trim();

    if (clientIP && isIPWhitelisted(clientIP)) {
        return true;
    }

    return false;
};
