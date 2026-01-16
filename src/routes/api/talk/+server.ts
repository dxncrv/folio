import { json, type Cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	MAX_MESSAGE_LENGTH,
	USERNAME_MAX_LENGTH,
	validateUsername,
	validateMessage,
	setSessionCookie,
	clearSessionCookie,
	getAuthUser
} from '$lib/server';

type TalkAction = 'login' | 'logout' | 'session' | 'message' | 'edit' | 'delete';

interface TalkRequest {
	readonly action: TalkAction;
	readonly username?: string;
	readonly text?: string;
	readonly messageId?: string;
	readonly expiresIn?: number;
}

function mapMessage(record: any) {
    return {
        id: record.id,
        username: record.username,
        text: record.text,
        timestamp: new Date(record.created).getTime(),
        status: 'sent'
    };
}

const handleLogin = (data: TalkRequest, cookies: Cookies): Response => {
	const username = validateUsername(data.username);
	if (!username) {
		return json({ error: `Username must be 1-${USERNAME_MAX_LENGTH} characters` }, { status: 400 });
	}
	setSessionCookie(cookies, username);
	return json({ username });
};

const handleLogout = (_: TalkRequest, cookies: Cookies): Response => {
	clearSessionCookie(cookies);
	return json({ success: true });
};

const handleSession = (_: TalkRequest, cookies: Cookies): Response => {
	const username = getAuthUser(cookies);
	return username
		? json({ authenticated: true, username })
		: json({ authenticated: false }, { status: 401 });
};

const handleMessage = async (data: TalkRequest, cookies: Cookies, locals: App.Locals): Promise<Response> => {
	const username = getAuthUser(cookies);
	if (!username) return json({ error: 'Not authenticated' }, { status: 401 });

	const text = validateMessage(data.text);
	if (!text) return json({ error: `Message must be 1-${MAX_MESSAGE_LENGTH} characters` }, { status: 400 });

	try {
        const record = await locals.pb.collection('messages').create({
            username,
            text
            // expiresIn ignored for now
        });
		return json({ ...mapMessage(record), version: 1 });
	} catch (e) {
		return json({ error: 'Failed' }, { status: 500 });
	}
};

const handleEdit = async (data: TalkRequest, cookies: Cookies, locals: App.Locals): Promise<Response> => {
	const username = getAuthUser(cookies);
	if (!username) return json({ error: 'Not authenticated' }, { status: 401 });
	if (!data.messageId) return json({ error: 'Message ID required' }, { status: 400 });

	const text = validateMessage(data.text);
	if (!text) return json({ error: 'Invalid message' }, { status: 400 });

	try {
        // Enforce ownership
        const record = await locals.pb.collection('messages').getOne(data.messageId);
        if (record.username !== username) return json({ error: 'Unauthorized' }, { status: 403 });

        const updated = await locals.pb.collection('messages').update(data.messageId, { text });
		return json({ ...mapMessage(updated), version: 1 });
	} catch (e) {
		return json({ error: 'Failed' }, { status: 500 });
	}
};

const handleDelete = async (data: TalkRequest, cookies: Cookies, locals: App.Locals): Promise<Response> => {
	const username = getAuthUser(cookies);
	if (!username) return json({ error: 'Not authenticated' }, { status: 401 });
	if (!data.messageId) return json({ error: 'Message ID required' }, { status: 400 });

	try {
        const record = await locals.pb.collection('messages').getOne(data.messageId);
        if (record.username !== username) return json({ error: 'Unauthorized' }, { status: 403 });

        await locals.pb.collection('messages').delete(data.messageId);
		return json({ success: true, version: 1 });
	} catch (e) {
		return json({ error: 'Failed' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	try {
		const data: TalkRequest = await request.json();
		switch (data.action) {
			case 'login': return handleLogin(data, cookies);
			case 'logout': return handleLogout(data, cookies);
			case 'session': return handleSession(data, cookies);
			case 'message': return handleMessage(data, cookies, locals);
			case 'edit': return handleEdit(data, cookies, locals);
			case 'delete': return handleDelete(data, cookies, locals);
			default: return json({ error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
    // Return last 50 messages
    try {
        const records = await locals.pb.collection('messages').getList(1, 50, {
            sort: '-created'
        });
        const messages = records.items.reverse().map(mapMessage);
        return json({ version: Date.now(), messages });
    } catch {
        return json({ version: Date.now(), messages: [] });
    }
};

