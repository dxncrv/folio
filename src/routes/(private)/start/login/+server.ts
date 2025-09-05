import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { RedisStore } from '$lib/server/redis.server';

/**
 * POST /start/login
 * Expects JSON: { token: string }
 * If the token matches ADMIN_TOKEN, sets an HttpOnly cookie `admin_token` and returns ok.
 */
export const POST = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const token = (body?.token ?? '').toString();

    if (!env.ADMIN_TOKEN) {
      return json({ error: 'Server not configured' }, { status: 500 });
    }

    if (token === env.ADMIN_TOKEN) {
      // Create a session token and store mapping in Redis
      const sessionToken = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
        ? globalThis.crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(36).slice(2);
      const ttl = 60 * 60; // 1 hour
      await RedisStore.setAdminSession(sessionToken, env.ADMIN_TOKEN, ttl);

      cookies.set('admin_token', sessionToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: env.NODE_ENV === 'production',
        path: '/',
        maxAge: ttl
      });
      return json({ ok: true });
    }

    return json({ error: 'Forbidden' }, { status: 403 });
  } catch (err) {
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};
