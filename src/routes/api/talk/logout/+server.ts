import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /api/talk/logout
 * Clear the session cookie
 */
export const POST: RequestHandler = async ({ cookies }) => {
	try {
		// Clear the talk_username cookie by setting maxAge to 0
		cookies.set('talk_username', '', {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0 // This immediately expires the cookie
		});

		return json({ success: true });
	} catch (error) {
		console.error('Logout error:', error);
		return json({ error: 'Logout failed' }, { status: 500 });
	}
};
