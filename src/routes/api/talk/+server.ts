import { json, type Cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRedisClient } from '$lib/server/redis.server';
import type { TalkMessage } from '$lib/types';

// Modern RequestHandler patterns for API routes
// Redis LRANGE/RPUSH for message persistence

const MESSAGES_KEY = 'folio:talk:messages';
const MAX_MESSAGE_LENGTH = 5000;
const USERNAME_MAX_LENGTH = 50;
const SESSION_MAX_AGE = 86400 * 30; // 30 days

// ============================================================================
// Type-safe action routing
// ============================================================================

type TalkAction = 'login' | 'logout' | 'session' | 'message' | 'edit' | 'delete';

interface TalkRequest {
	readonly action: TalkAction;
	readonly username?: string;
	readonly text?: string;
	readonly messageId?: string;
}

// ============================================================================
// Utilities (Pure functions for testability and performance)
// ============================================================================

/**
 * Sanitize HTML to prevent XSS - escapes dangerous characters
 * @pure
 */
const sanitizeHtml = (text: string): string =>
	text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');

/**
 * Get all chat messages from Redis
 */
const getMessages = async (): Promise<TalkMessage[]> => {
	try {
		const client = getRedisClient();
		const messages = await client.lrange(MESSAGES_KEY, 0, -1);
		return messages.map((m) => JSON.parse(m) as TalkMessage);
	} catch (error) {
		console.error('[talk] Error fetching messages:', error);
		return [];
	}
};

/**
 * Add message to Redis with sanitization
 */
const addMessage = async (username: string, text: string): Promise<TalkMessage> => {
	const client = getRedisClient();
	const message: TalkMessage = {
		id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
		username,
		text: sanitizeHtml(text.trim()),
		timestamp: Date.now()
	};
	await client.rpush(MESSAGES_KEY, JSON.stringify(message));
	return message;
};

/**
 * Update a message in Redis (only if user owns it)
 */
const updateMessage = async (messageId: string, username: string, newText: string): Promise<TalkMessage> => {
	const client = getRedisClient();
	const messages = await getMessages();
	const index = messages.findIndex(m => m.id === messageId);
	
	if (index === -1) {
		throw new Error('Message not found');
	}
	
	if (messages[index].username !== username) {
		throw new Error('Unauthorized: You can only edit your own messages');
	}
	
	const updatedMessage: TalkMessage = {
		...messages[index],
		text: sanitizeHtml(newText.trim()),
		timestamp: messages[index].timestamp // Keep original timestamp
	};
	
	// Update the message in Redis list
	await client.lset(MESSAGES_KEY, index, JSON.stringify(updatedMessage));
	return updatedMessage;
};

/**
 * Delete a message from Redis (only if user owns it)
 */
const deleteMessage = async (messageId: string, username: string): Promise<void> => {
	const client = getRedisClient();
	const messages = await getMessages();
	const message = messages.find(m => m.id === messageId);
	
	if (!message) {
		throw new Error('Message not found');
	}
	
	if (message.username !== username) {
		throw new Error('Unauthorized: You can only delete your own messages');
	}
	
	// Mark for deletion by setting to a sentinel value, then remove it
	// Redis doesn't support LREM by index, so we use LREM by value
	await client.lrem(MESSAGES_KEY, 1, JSON.stringify(message));
};

/**
 * Cookie management utilities
 */
const cookieConfig = (maxAge: number = SESSION_MAX_AGE) => ({
	path: '/',
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge
});

const setSessionCookie = (cookies: Cookies, username: string) =>
	cookies.set('talk_username', username, cookieConfig());

const clearSessionCookie = (cookies: Cookies) =>
	cookies.set('talk_username', '', cookieConfig(0));

const getAuthUser = (cookies: Cookies): string | null =>
	cookies.get('talk_username') || null;

// ============================================================================
// Action Handlers - Strategy pattern for routing
// ============================================================================

/**
 * Validate and normalize username input
 */
const validateUsername = (username: unknown): string | null => {
	if (typeof username !== 'string') return null;
	const normalized = username.trim();
	return normalized.length > 0 && normalized.length <= USERNAME_MAX_LENGTH ? normalized : null;
};

/**
 * Validate message text input
 */
const validateMessage = (text: unknown): string | null => {
	if (typeof text !== 'string') return null;
	const trimmed = text.trim();
	return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH ? trimmed : null;
};

/**
 * Action: Login user and create session
 */
const handleLogin = (data: TalkRequest, cookies: Cookies): Response => {
	const username = validateUsername(data.username);
	if (!username) {
		return json(
			{ error: `Username must be 1-${USERNAME_MAX_LENGTH} characters` },
			{ status: 400 }
		);
	}
	setSessionCookie(cookies, username);
	return json({ username });
};

/**
 * Action: Logout user and clear session
 */
const handleLogout = (_: TalkRequest, cookies: Cookies): Response => {
	clearSessionCookie(cookies);
	return json({ success: true });
};

/**
 * Action: Check session validity
 */
const handleSession = (_: TalkRequest, cookies: Cookies): Response => {
	const username = getAuthUser(cookies);
	return username
		? json({ authenticated: true, username })
		: json({ authenticated: false }, { status: 401 });
};

/**
 * Action: Send a chat message (requires auth)
 */
const handleMessage = async (data: TalkRequest, cookies: Cookies): Promise<Response> => {
	const username = getAuthUser(cookies);
	if (!username) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const text = validateMessage(data.text);
	if (!text) {
		return json(
			{ error: `Message must be 1-${MAX_MESSAGE_LENGTH} characters` },
			{ status: 400 }
		);
	}

	const message = await addMessage(username, text);
	return json(message);
};

/**
 * Action: Edit a chat message (requires auth and ownership)
 */
const handleEdit = async (data: TalkRequest, cookies: Cookies): Promise<Response> => {
	const username = getAuthUser(cookies);
	if (!username) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	if (!data.messageId) {
		return json({ error: 'Message ID required' }, { status: 400 });
	}

	const text = validateMessage(data.text);
	if (!text) {
		return json(
			{ error: `Message must be 1-${MAX_MESSAGE_LENGTH} characters` },
			{ status: 400 }
		);
	}

	try {
		const message = await updateMessage(data.messageId, username, text);
		return json(message);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to edit message';
		const status = message.includes('Unauthorized') ? 403 : message.includes('not found') ? 404 : 500;
		return json({ error: message }, { status });
	}
};

/**
 * Action: Delete a chat message (requires auth and ownership)
 */
const handleDelete = async (data: TalkRequest, cookies: Cookies): Promise<Response> => {
	const username = getAuthUser(cookies);
	if (!username) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	if (!data.messageId) {
		return json({ error: 'Message ID required' }, { status: 400 });
	}

	try {
		await deleteMessage(data.messageId, username);
		return json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to delete message';
		const status = message.includes('Unauthorized') ? 403 : message.includes('not found') ? 404 : 500;
		return json({ error: message }, { status });
	}
};

// ============================================================================
// Action Dispatcher - Strategy pattern routing
// ============================================================================

type ActionHandler = (data: TalkRequest, cookies: Cookies) => Promise<Response> | Response;

const actionHandlers: Record<TalkAction, ActionHandler> = {
	login: handleLogin,
	logout: handleLogout,
	session: handleSession,
	message: handleMessage,
	edit: handleEdit,
	delete: handleDelete
} as const;

// ============================================================================
// HTTP Handlers - RequestHandler best practices
// ============================================================================

/**
 * GET /api/talk
 * Fetch all messages or check session (via ?action=session)
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const action = url.searchParams.get('action') as TalkAction | null;

		if (action === 'session') {
			return handleSession({ action: 'session' }, cookies);
		}

		const messages = await getMessages();
		return json(messages);
	} catch (error) {
		console.error('[talk] GET error:', error);
		return json({ error: 'Request failed' }, { status: 500 });
	}
};

/**
 * POST /api/talk
 * Action-based routing: { action: 'login'|'logout'|'session'|'message', ...data }
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const data = (await request.json()) as TalkRequest;

		if (!data.action) {
			return json({ error: 'Action field required' }, { status: 400 });
		}

		const handler = actionHandlers[data.action];
		if (!handler) {
			return json({ error: `Unknown action: ${data.action}` }, { status: 400 });
		}

		return await handler(data, cookies);
	} catch (error) {
		console.error('[talk] POST error:', error);
		return json({ error: 'Request failed' }, { status: 500 });
	}
};
