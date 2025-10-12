import type { PageServerLoad } from './$types';
import { RedisStore } from '$lib/server/redis.server';

// Context7: /sveltejs/kit - Server load function for SSR with proper error handling
export const load: PageServerLoad = async ({ setHeaders }) => {
	try {
		const projects = await RedisStore.getProjects();
		
		// Set cache headers for better performance and SEO crawling
		// Cache for 5 minutes on client, revalidate for 1 hour on CDN
		setHeaders({
			'cache-control': 'public, max-age=300, s-maxage=3600'
		});
		
		return { projects };
	} catch (error) {
		console.error('Failed to load projects:', error);
		return { projects: [] };
	}
};
