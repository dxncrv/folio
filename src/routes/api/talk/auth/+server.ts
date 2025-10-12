import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidUser } from '$lib/server/talk.server';

/**
 * POST /api/talk/auth
 * Authenticate user by username (no password required)
 * Pseudo-auth for testing - stores username directly in cookie
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { username } = await request.json();

        if (!username || typeof username !== 'string') {
            return json({ error: 'Username required' }, { status: 400 });
        }

        const normalizedUsername = username.toLowerCase().trim();

        if (!isValidUser(normalizedUsername)) {
            return json({ error: 'Invalid username' }, { status: 403 });
        }

        // Store username directly in cookie (pseudo-auth for testing)
        cookies.set('talk_session', normalizedUsername, {
            path: '/',
            httpOnly: true,
            secure: false, // set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 86400 // 1 day
        });

        return json({ username: normalizedUsername });
    } catch (error) {
        console.error('Auth error:', error);
        return json({ error: 'Authentication failed' }, { status: 500 });
    }
};
