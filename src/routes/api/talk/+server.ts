import { json, type Cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	MAX_MESSAGE_LENGTH,
	USERNAME_MAX_LENGTH,
	validateUsername,
	validateMessage,
	setSessionCookie,
	clearSessionCookie,
	getAuthUser,
	MessageService
} from '$lib/server';
import { getRedisClient } from '$lib/server/redis.server';
import type { TalkMessage } from '$lib/types';

// Singleton service instance
let messageService: MessageService | null = null;
const getService = () => {
	if (!messageService) {
		const client = getRedisClient();
		messageService = new MessageService(client, client);
	}
	return messageService;
};

// Modern RequestHandler patterns for API routes
// Storage: ZSET (message IDs sorted by timestamp) + HASH (message data)
// See MessageService for implementation details

type TalkAction = 'login' | 'logout' | 'session' | 'message' | 'edit' | 'delete';

interface TalkRequest {
	readonly action: TalkAction;
	readonly username?: string;
	readonly text?: string;
	readonly messageId?: string;
}

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

	const { message, version } = await getService().addMessage(username, text);
	return json({ ...message, version });
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
		const { message, version } = await getService().updateMessage(data.messageId, username, text);
		return json({ ...message, version });
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
		const { version } = await getService().deleteMessage(data.messageId, username);
		return json({ success: true, version });
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
 * Returns { version, messages } for delta support
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const action = url.searchParams.get('action') as TalkAction | null;

		if (action === 'session') {
			return handleSession({ action: 'session' }, cookies);
		}

		const limit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get('limit') || '200', 10)));
		
		const service = getService();
		const [version, messages] = await Promise.all([
			service.getVersion(),
			service.getMessages(limit)
		]);
		
		return json({ version, messages });
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
