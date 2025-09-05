import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Server-side guard: if admin_token cookie not present, redirect to /start/login
export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) {
    // Not authenticated — redirect to login
    throw redirect(303, '/start/login');
  }
  return {};
};
