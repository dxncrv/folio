import { withHandler, withAdmin } from '$lib/server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

async function fetchProjects(pb: any) {
	const items = await pb.collection('projects').getFullList({ 
		sort: '+order,-id',
		expand: 'studies',
		skipTotal: true
	});
	return items;
}

export const GET: RequestHandler = withHandler(async ({ locals, setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=60' });
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
