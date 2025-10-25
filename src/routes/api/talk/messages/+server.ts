import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMessages, addMessage, getSession, updateSessionActivity } from '$lib/server/talk.server';

/**
 * GET /api/talk/messages
 * Fetch all messages
 */
export const GET: RequestHandler = async () => {
    try {
        const messages = await getMessages();
        return json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
};

/**
 * POST /api/talk/messages
 * Send a new message (requires valid session)
 * Session validated via Redis (username:ip from cookie)
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const sessionId = cookies.get('talk_session');
        if (!sessionId) {
            console.error('[talk/messages] No session cookie found');
            return json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Parse sessionId: "username:ip"
        const parts = sessionId.split(':');
        if (parts.length < 2) {
            console.error('[talk/messages] Invalid session format:', sessionId);
            return json({ error: 'Invalid session format' }, { status: 401 });
        }
        
        const username = parts[0];
        const sessionIp = parts.slice(1).join(':'); // Handle IPv6 addresses with colons

        // Validate session exists in Redis (using stored IP from cookie)
        const session = await getSession(username, sessionIp);
        if (!session) {
            console.error('[talk/messages] Session not found in Redis for:', username, sessionIp);
            return json({ error: 'Invalid session' }, { status: 401 });
        }

        const { text } = await request.json();
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return json({ error: 'Message text required' }, { status: 400 });
        }

        if (text.length > 5000) {
            return json({ error: 'Message too long (max 5000 chars)' }, { status: 400 });
        }

        // Update session activity
        await updateSessionActivity(username, sessionIp);

        // Add message (will be sanitized in talk.server.ts)
        const message = await addMessage(username, text);
        return json(message);
    } catch (error) {
        console.error('Error posting message:', error);
        return json({ error: 'Failed to post message' }, { status: 500 });
    }
};
