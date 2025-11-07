import { RedisStore, withAdmin } from '$lib/server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = withAdmin(async ({ params, request }) => {
	const title = decodeURIComponent(params.title ?? '');
	const updatedProject: Project = await request.json();
	if (!updatedProject.title || !updatedProject.tags || !Array.isArray(updatedProject.tags)) {
		return { error: 'Invalid project data' } as any;
	}
	const projects = await RedisStore.updateProject(title, updatedProject);
	return projects;
});

export const DELETE: RequestHandler = withAdmin(async ({ params }) => {
	const title = decodeURIComponent(params.title ?? '');
	const projects = await RedisStore.deleteProject(title);
	return projects;
});
