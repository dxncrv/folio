import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('admin_session');
  if (session === 'authenticated') {
    throw redirect(303, '/start');
  }
  return {};
};
