import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/server/redis.server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

// PUT: Update a specific project
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const title = decodeURIComponent(params.title);
		const updatedProject: Project = await request.json();
		
		// Basic validation
		if (!updatedProject.title || !updatedProject.tags || !Array.isArray(updatedProject.tags)) {
			return json({ error: 'Invalid project data' }, { status: 400 });
		}

		const projects = await RedisStore.updateProject(title, updatedProject);
		return json(projects);
	} catch (error) {
		if (error instanceof Error && error.message.includes('not found')) {
			return json({ error: error.message }, { status: 404 });
		}
		return json({ error: 'Failed to update project' }, { status: 500 });
	}
};

// DELETE: Delete a specific project
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const title = decodeURIComponent(params.title);
		const projects = await RedisStore.deleteProject(title);
		return json(projects);
	} catch (error) {
		if (error instanceof Error && error.message.includes('not found')) {
			return json({ error: error.message }, { status: 404 });
		}
		return json({ error: 'Failed to delete project' }, { status: 500 });
	}
};
