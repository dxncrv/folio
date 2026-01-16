import type { PageServerLoad } from './$types';
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
export const load: PageServerLoad = async ({ params, setHeaders, locals, depends, parent }) => {
	// Re-use projects data from parent layout to avoid redundant fetches
	await parent();

	// Explicitly depend on params.slug to ensure this load function reruns when slug changes
	depends(`app:project:${params.slug}`);
	try {
		// Fetch project with expanded studies relation
		const project = await locals.pb.collection('projects').getFirstListItem(
			`slug="${params.slug}"`,
			{ expand: 'studies' }
		);

		// Extract study content from the expanded relation
		let studyContent = '';
		if (project.expand?.studies) {
			// studies can be a single object or array, handle both
			const study = Array.isArray(project.expand.studies) 
				? project.expand.studies[0] 
				: project.expand.studies;
			studyContent = study?.content || '';
		}

		// Set cache headers for better performance and SEO crawling
		setHeaders({
			'cache-control': 'public, max-age=300, s-maxage=3600'
		});

		return {
			project: {
				...project,
				study: studyContent // Add study content to project object for backward compatibility
			}
		};
	} catch (err: any) {
		console.error('Failed to load project:', err);
		throw error(404, 'Project not found');
	}
};
