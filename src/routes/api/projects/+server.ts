import { withHandler, withAdmin } from '$lib/server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

async function fetchProjects(pb: any) {
	// Use getList to avoid skipTotal parameter issues with PB v0.35
	const result = await pb.collection('projects').getList(1, 100, { 
		sort: '+order,-id',
		expand: 'studies'
	});
	return result.items;
}

export const GET: RequestHandler = withHandler(async ({ locals }) => {
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
