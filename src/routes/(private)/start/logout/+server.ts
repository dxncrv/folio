import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/server/redis.server';

export const POST = async ({ cookies }) => {
  const session = cookies.get('admin_token');
  if (session) {
    try {
      await RedisStore.deleteAdminSession(session);
    } catch (err) {
      // ignore errors
    }
  }
  // Clear cookie
  cookies.delete('admin_token', { path: '/' });
  return json({ ok: true });
};
