import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/server/redis.server';
import { isAuthorizedWrite } from '$lib/server/security.server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';
import type { RequestEvent } from '@sveltejs/kit';

// PUT: Update a specific project
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		if (!(await isAuthorizedWrite(request as Request))) return json({ error: 'Forbidden' }, { status: 403 });
		const title = decodeURIComponent(params.title ?? '');
		const updatedProject: Project = await request.json();

		// Basic validation
		if (!updatedProject.title || !updatedProject.tags || !Array.isArray(updatedProject.tags)) {
			return json({ error: 'Invalid project data' }, { status: 400 });
		}

		const projects = await RedisStore.updateProject(title, updatedProject);
		return json(projects);
	} catch (e) {
		const error = e instanceof Error ? e : new Error('Unknown error');
		if (error.message.includes('not found')) {
			return json({ error: error.message }, { status: 404 });
		}
		return json({ error: 'Failed to update project' }, { status: 500 });
	}
};

// DELETE: Delete a specific project
export const DELETE = async (event: RequestEvent) => {
	try {
		if (!(await isAuthorizedWrite(event.request))) return json({ error: 'Forbidden' }, { status: 403 });
		const title = decodeURIComponent(event.params.title ?? '');
		const projects = await RedisStore.deleteProject(title);
		return json(projects);
	} catch (e) {
		const error = e instanceof Error ? e : new Error('Unknown error');
		if (error.message.includes('not found')) {
			return json({ error: error.message }, { status: 404 });
		}
		return json({ error: 'Failed to delete project' }, { status: 500 });
	}
};
