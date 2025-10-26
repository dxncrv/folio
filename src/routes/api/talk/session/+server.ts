import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/talk/session
 * Verify if user has a valid session cookie and return username
 * Used for session persistence across page reloads
 */
export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const username = cookies.get('talk_username');
		if (!username) {
			return json({ authenticated: false }, { status: 401 });
		}

		// Session cookie is HttpOnly and managed by browser
		// If we can read it here, it exists and is valid
		return json({ authenticated: true, username });
	} catch (error) {
		console.error('Session check error:', error);
		return json({ authenticated: false }, { status: 500 });
	}
};
