import { RedisStore } from '$lib/server/redis.server';
import { withHandler, withAdmin } from '$lib/server/api-utils.server';
import type { Media } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = withHandler(async () => {
	return await RedisStore.getMedia();
});

export const POST: RequestHandler = withAdmin(async ({ request }) => {
	const media: Media[] = await request.json();
	if (!Array.isArray(media)) return { error: 'Invalid data format' } as any;
	await RedisStore.setMedia(media);
	return media;
});

export const PUT: RequestHandler = withAdmin(async ({ request }) => {
	const item: Media = await request.json();
	if (!item.id || !item.path) return { error: 'Invalid media data' } as any;
	const media = await RedisStore.updateMedia(item.id, item);
	return media;
});

export const DELETE: RequestHandler = withAdmin(async ({ request }) => {
	const { id } = await request.json();
	if (!id) return { error: 'Missing id' } as any;
	const media = await RedisStore.deleteMedia(id);
	return media;
});
