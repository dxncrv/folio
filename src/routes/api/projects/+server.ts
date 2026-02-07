import { withHandler, withAdmin } from '$lib/server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

async function fetchProjects(pb: any) {
	console.log('[API Projects] Attempting to fetch from PocketBase...');
	try {
		// Use getFullList with skipTotal for maximum performance in PB v0.35+
		const items = await pb.collection('projects').getFullList({ 
			sort: '+order,-id',
			expand: 'studies',
			skipTotal: true
		});
		console.log(`[API Projects] Successfully fetched ${items.length} projects`);
		return items;
	} catch (error) {
		console.error('[API Projects] Fetch failed:', error);
		throw error;
	}
}

export const GET: RequestHandler = withHandler(async ({ locals, setHeaders }) => {
	console.log('[API GET /projects] Handler called');
	
	// Optimization: Cache results for 1 minute to reduce egress and PB load
	setHeaders({
		'cache-control': 'public, max-age=60'
	});

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
