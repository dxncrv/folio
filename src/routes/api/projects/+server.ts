import { withHandler, withAdmin } from '$lib/server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

async function fetchProjects(pb: any) {
	console.log('[API Projects] Attempting to fetch from PocketBase...');
	try {
		// Use getList to avoid skipTotal parameter issues with PB v0.35
		const result = await pb.collection('projects').getList(1, 100, { 
			sort: '+order,-id',
			expand: 'studies'
		});
		console.log(`[API Projects] Successfully fetched ${result.items.length} projects`);
		return result.items;
	} catch (error) {
		console.error('[API Projects] Fetch failed:', error);
		throw error;
	}
}

export const GET: RequestHandler = withHandler(async ({ locals }) => {
	console.log('[API GET /projects] Handler called');
	return await fetchProjects(locals.pb);
});

export const POST: RequestHandler = withAdmin(async ({ request, locals }) => {
	const project: Project = await request.json();
	if (!project.title) {
		return { error: 'Invalid project data' } as any;
	}
	await locals.pb.collection('projects').create(project);
	return await fetchProjects(locals.pb);
});

export const PUT: RequestHandler = withAdmin(async ({ request, locals }) => {
	// Bulk update logic is complex to migrate 1:1. 
	// For now, we return the current list which refreshes the client.
	return await fetchProjects(locals.pb);
});
