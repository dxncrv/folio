import { scanMedia, withAdmin } from '$lib/server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = withAdmin(async () => {
	const media = await scanMedia();
	return { success: true, count: media.length };
});
