import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * POST /start/login
 * Expects JSON: { token: string }
 * Authenticates against ADMIN_TOKEN environment variable.
 */
export const POST = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const token = (body?.token ?? '').toString().trim();
    const ADMIN_TOKEN = env.ADMIN_TOKEN ?? '';

    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    // Session duration: 24 hours
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    const maxAge = 24 * 60 * 60; // 24 hours in seconds

    // Set admin session cookie
    cookies.set('admin_session', 'authenticated', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });

    return json({ ok: true, expiresAt });
  } catch (err) {
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};
