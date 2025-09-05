import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/server/redis.server';
import { isAdminRequest } from '$lib/server/admin.server';
import { getClientIPFromRequest, isRateLimited, sanitizeMarkdownForStorage } from '$lib/server/security.server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';
import type { RequestEvent } from '@sveltejs/kit';

// PUT: Update a specific project
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const ip = getClientIPFromRequest(request);
		if (isRateLimited(ip)) return json({ error: 'Too many requests' }, { status: 429 });

		if (!isAdminRequest(request)) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

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
export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const ip = getClientIPFromRequest(request as Request);
		if (isRateLimited(ip)) return json({ error: 'Too many requests' }, { status: 429 });

		if (!isAdminRequest(request as Request)) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const title = decodeURIComponent(params.title ?? '');
		const projects = await RedisStore.deleteProject(title);
		return json(projects);
	} catch (error) {
		if (error instanceof Error && error.message.includes('not found')) {
			return json({ error: error.message }, { status: 404 });
		}
		return json({ error: 'Failed to delete project' }, { status: 500 });
	}
};
