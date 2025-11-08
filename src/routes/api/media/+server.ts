import { RedisStore, withHandler, withAdmin } from '$lib/server';
import type { Media } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = withHandler(async () => {
	// TODO: Deprecate or revise media feature - currently disabled to reduce Redis load
	// Original: return await RedisStore.getMedia();
	return []; // Return empty array to disable Redis operations
});

export const POST: RequestHandler = withAdmin(async ({ request }) => {
	// TODO: Deprecate or revise media feature - currently disabled to reduce Redis load
	// Original: const media: Media[] = await request.json(); if (!Array.isArray(media)) return { error: 'Invalid data format' } as any; await RedisStore.setMedia(media); return media;
	return { error: 'Media operations disabled' } as any;
});

export const PUT: RequestHandler = withAdmin(async ({ request }) => {
	// TODO: Deprecate or revise media feature - currently disabled to reduce Redis load
	// Original: const item: Media = await request.json(); if (!item.id || !item.path) return { error: 'Invalid media data' } as any; const media = await RedisStore.updateMedia(item.id, item); return media;
	return { error: 'Media operations disabled' } as any;
});

export const DELETE: RequestHandler = withAdmin(async ({ request }) => {
	// TODO: Deprecate or revise media feature - currently disabled to reduce Redis load
	// Original: const { id } = await request.json(); if (!id) return { error: 'Missing id' } as any; const media = await RedisStore.deleteMedia(id); return media;
	return { error: 'Media operations disabled' } as any;
});
