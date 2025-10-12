import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMessages, addMessage, isValidUser } from '$lib/server/talk.server';

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
 * Send a new message (requires authentication)
 * Username stored directly in cookie for pseudo-auth testing
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const username = cookies.get('talk_session');
        if (!username) {
            return json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Validate username is still in allowed list
        if (!isValidUser(username)) {
            return json({ error: 'Invalid session' }, { status: 401 });
        }

        const { text } = await request.json();
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return json({ error: 'Message text required' }, { status: 400 });
        }

        if (text.length > 1000) {
            return json({ error: 'Message too long (max 1000 chars)' }, { status: 400 });
        }

        const message = await addMessage(username, text.trim());
        return json(message);
    } catch (error) {
        console.error('Error posting message:', error);
        return json({ error: 'Failed to post message' }, { status: 500 });
    }
};
