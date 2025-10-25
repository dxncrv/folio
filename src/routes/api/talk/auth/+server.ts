import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession } from '$lib/server/talk.server';

/**
 * POST /api/talk/auth
 * Authenticate user by username (open access, no validation)
 * Creates session tied to username + IP address
 */
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
    try {
        const { username } = await request.json();

        if (!username || typeof username !== 'string') {
            return json({ error: 'Username required' }, { status: 400 });
        }

        const normalizedUsername = username.trim();
        
        if (normalizedUsername.length === 0 || normalizedUsername.length > 50) {
            return json({ error: 'Username must be 1-50 characters' }, { status: 400 });
        }

        // Get client IP address
        const ip = getClientAddress();
        
        console.log('[talk/auth] Creating session for:', normalizedUsername, 'IP:', ip);
        
        // Create session in Redis (tied to username + IP)
        const session = await createSession(normalizedUsername, ip);

        // Store session ID in cookie (username:ip)
        const sessionId = `${normalizedUsername.toLowerCase()}:${ip}`;
        console.log('[talk/auth] Setting cookie with sessionId:', sessionId);
        
        cookies.set('talk_session', sessionId, {
            path: '/',
            httpOnly: true,
            secure: false, // set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 86400 * 30 // 30 days (2,592,000 seconds)
        });

        return json({ username: session.username, ip: session.ip });
    } catch (error) {
        console.error('Auth error:', error);
        return json({ error: 'Authentication failed' }, { status: 500 });
    }
};
