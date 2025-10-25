import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/talk.server';

/**
 * GET /api/talk/session
 * Check if user has a valid session cookie
 * Returns username if authenticated, 401 if not
 */
export const GET: RequestHandler = async ({ cookies }) => {
    try {
        const sessionId = cookies.get('talk_session');
        
        if (!sessionId) {
            return json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Parse sessionId: "username:ip"
        const parts = sessionId.split(':');
        if (parts.length < 2) {
            return json({ error: 'Invalid session format' }, { status: 401 });
        }
        
        const username = parts[0];
        const sessionIp = parts.slice(1).join(':'); // Handle IPv6

        // Validate session exists in Redis
        const session = await getSession(username, sessionIp);
        if (!session) {
            return json({ error: 'Session expired' }, { status: 401 });
        }

        return json({ username: session.username });
    } catch (error) {
        console.error('Session check error:', error);
        return json({ error: 'Session check failed' }, { status: 500 });
    }
};
