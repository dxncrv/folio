import { scanMedia } from '$lib/server/media-scanner.server';
import { withAdmin } from '$lib/server/api-utils.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = withAdmin(async () => {
	const media = await scanMedia();
	return { success: true, count: media.length };
});
