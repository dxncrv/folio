import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRedisClient } from '$lib/server/redis.server';
import type { TalkMessage } from '$lib/types';

const MESSAGES_KEY = 'folio:talk:messages';

/**
 * Sanitize HTML to prevent XSS injection
 * Escapes <, >, &, ", ' characters
 */
function sanitizeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Get all chat messages from Redis
 */
async function getMessages(): Promise<TalkMessage[]> {
	try {
		const client = getRedisClient();
		const messages = await client.lrange(MESSAGES_KEY, 0, -1);
		return messages.map((m) => JSON.parse(m) as TalkMessage);
	} catch (error) {
		console.error('Error fetching messages:', error);
		return [];
	}
}

/**
 * Add a message to Redis (with sanitization)
 */
async function addMessage(username: string, text: string): Promise<TalkMessage> {
	const client = getRedisClient();

	// Sanitize text to prevent XSS
	const sanitizedText = sanitizeHtml(text.trim());

	const message: TalkMessage = {
		id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
		username,
		text: sanitizedText,
		timestamp: Date.now()
	};

	// Push to list
	await client.rpush(MESSAGES_KEY, JSON.stringify(message));

	return message;
}

/**
 * GET /api/talk
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
 * POST /api/talk
 * Send a new message (requires valid session cookie)
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Get username from cookie (trust the cookie, it's HttpOnly)
		const username = cookies.get('talk_username');
		if (!username) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { text } = await request.json();
		if (!text || typeof text !== 'string' || text.trim().length === 0) {
			return json({ error: 'Message text required' }, { status: 400 });
		}

		if (text.length > 5000) {
			return json({ error: 'Message too long (max 5000 chars)' }, { status: 400 });
		}

		// Add message (will be sanitized)
		const message = await addMessage(username, text);
		return json(message);
	} catch (error) {
		console.error('Error posting message:', error);
		return json({ error: 'Failed to post message' }, { status: 500 });
	}
};
