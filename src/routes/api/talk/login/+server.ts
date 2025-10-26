import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /api/talk/login
 * Authenticate user by username (open access, no validation)
 * Sets HttpOnly cookie with username
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username } = await request.json();

		if (!username || typeof username !== 'string') {
			return json({ error: 'Username required' }, { status: 400 });
		}

		const normalizedUsername = username.trim();

		if (normalizedUsername.length === 0 || normalizedUsername.length > 50) {
			return json({ error: 'Username must be 1-50 characters' }, { status: 400 });
		}

		// Set HttpOnly cookie with username (30-day session persistence)
		cookies.set('talk_username', normalizedUsername, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production', // HTTPS only in production
			sameSite: 'lax',
			maxAge: 86400 * 30 // 30 days
		});

		return json({ username: normalizedUsername });
	} catch (error) {
		console.error('Auth error:', error);
		return json({ error: 'Authentication failed' }, { status: 500 });
	}
};
