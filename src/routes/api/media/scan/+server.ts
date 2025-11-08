import { scanMedia, withAdmin } from '$lib/server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = withAdmin(async () => {
	// TODO: Deprecate or revise media scanning feature - currently disabled to reduce filesystem and Redis load
	// Original: const media = await scanMedia(); return { success: true, count: media.length };
	return { success: false, error: 'Media scanning disabled', count: 0 };
});
