import type { PageServerLoad } from './$types';
import { RedisStore } from '$lib/server';
import { error } from '@sveltejs/kit';

/**
 * Catchall route pattern: src/routes/(public)/projects/[...slug]
 * 
 * Context7: /llmstxt/svelte_dev_kit_llms_txt - Rest parameter [...]
 * captures the entire remaining path segment as a string (e.g., "my-project-title")
 * and makes it available in params.slug. This enables flexible URL structures
 * for nested content like case studies.
 * 
 * Potential improvements to this pattern:
 * - Add parameterized filtering: allow ?facets=tag1,tag2 to pre-filter projects
 * - Implement 404 error page component for better UX on missing studies
 * - Add breadcrumb navigation for case study hierarchy
 * - Add prefetching of related case studies in +layout for faster nav
 */
export const load: PageServerLoad = async ({ params, setHeaders }) => {
	try {
		const projects = await RedisStore.getProjects();

		// Find the matching project by slug
		const project = projects.find((p) => p.slug === params.slug);

		if (!project) {
			throw error(404, 'Project not found');
		}

		// Set cache headers for better performance and SEO crawling
		setHeaders({
			'cache-control': 'public, max-age=300, s-maxage=3600'
		});

		return {
			projects,
			project
		};
	} catch (err: any) {
		if (err.status === 404) {
			throw err;
		}
		console.error('Failed to load project study:', err);
		throw error(500, 'Failed to load project data');
	}
};
