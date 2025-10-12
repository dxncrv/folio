import type { PageServerLoad } from './$types';
import { RedisStore } from '$lib/server/redis.server';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	try {
		const [projects, caseStudies] = await Promise.all([
			RedisStore.getProjects(),
			RedisStore.getCaseStudies()
		]);

		// Find the matching case study by slug
		const caseStudy = caseStudies.find((cs) => cs.slug === params.slug);

		if (!caseStudy) {
			throw error(404, 'Case study not found');
		}

		// Set cache headers for better performance and SEO crawling
		// Cache for 5 minutes on client, revalidate for 1 hour on CDN
		setHeaders({
			'cache-control': 'public, max-age=300, s-maxage=3600'
		});

		return {
			projects,
			caseStudy
		};
	} catch (err: any) {
		if (err.status === 404) {
			throw err;
		}
		console.error('Failed to load project study:', err);
		throw error(500, 'Failed to load project data');
	}
};
