import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { POCKETBASE_URL } from '$lib/server/pb';

// Server-side guard
export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('admin_session');
  if (session !== 'authenticated') {
    // Not authenticated — redirect to login
    throw redirect(303, '/start/login');
  }
  return {
    pbDashboardUrl: `${POCKETBASE_URL}/_/`
  };
};
