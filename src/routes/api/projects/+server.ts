import { RedisStore } from '$lib/server/redis.server';
import { withHandler, withAdmin } from '$lib/server/api-utils.server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = withHandler(async () => {
	return await RedisStore.getProjects();
});

export const POST: RequestHandler = withAdmin(async ({ request }) => {
	const project: Project = await request.json();
	if (!project.title || !project.tags || !Array.isArray(project.tags)) {
		return { error: 'Invalid project data' } as any;
	}
	const projects = await RedisStore.addProject(project);
	return projects;
});

export const PUT: RequestHandler = withAdmin(async ({ request }) => {
	const projects: Project[] = await request.json();
	if (!Array.isArray(projects)) return { error: 'Invalid data format' } as any;
	await RedisStore.setProjects(projects);
	return projects;
});
