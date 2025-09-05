import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/server/redis.server';
import { isAdminRequest } from '$lib/server/admin.server';
import { isRateLimited, getClientIPFromRequest, sanitizeMarkdownForStorage } from '$lib/server/security.server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

// GET: Fetch all projects
export const GET: RequestHandler = async () => {
	try {
		const projects = await RedisStore.getProjects();
		return json(projects);
	} catch (error) {
		return json({ error: 'Failed to fetch projects' }, { status: 500 });
	}
};

// POST: Create a new project
export const POST: RequestHandler = async ({ request }) => {
	try {
		const ip = getClientIPFromRequest(request);
		if (isRateLimited(ip)) return json({ error: 'Too many requests' }, { status: 429 });

		// Authorization: require ADMIN token or whitelisted IP for write
		if (!isAdminRequest(request)) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const project: Project = await request.json();
		
		// Basic validation
		if (!project.title || !project.tags || !Array.isArray(project.tags)) {
			return json({ error: 'Invalid project data' }, { status: 400 });
		}

		// sanitize any markdown-ish fields if present (best-effort)
		if (project.desc && typeof project.desc.code === 'string') {
			project.desc.code = sanitizeMarkdownForStorage(project.desc.code);
		}
		const projects = await RedisStore.addProject(project);
		return json(projects, { status: 201 });
	} catch (error) {
		return json({ error: 'Failed to create project' }, { status: 500 });
	}
};

// PUT: Update all projects (for bulk operations)
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const ip = getClientIPFromRequest(request);
		if (isRateLimited(ip)) return json({ error: 'Too many requests' }, { status: 429 });

		if (!isAdminRequest(request)) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const projects: Project[] = await request.json();
		
		if (!Array.isArray(projects)) {
			return json({ error: 'Invalid data format' }, { status: 400 });
		}

		await RedisStore.setProjects(projects);
		return json(projects);
	} catch (error) {
		return json({ error: 'Failed to update projects' }, { status: 500 });
	}
};
