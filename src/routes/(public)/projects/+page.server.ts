import type { PageServerLoad } from './$types';
import { RedisStore } from '$lib/server/redis.server';

export const load: PageServerLoad = async () => {
	try {
		const projects = await RedisStore.getProjects();
		return { projects };
	} catch (error) {
		console.error('Failed to load projects:', error);
		return { projects: [] };
	}
};
