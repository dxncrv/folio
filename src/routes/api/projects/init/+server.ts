import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/redis';
import projectsData from '$lib/projects.json';
import type { RequestHandler } from './$types';

// POST: Initialize Redis store with data from projects.json
export const POST: RequestHandler = async () => {
	try {
		await RedisStore.initializeFromJson(projectsData);
		const projects = await RedisStore.getProjects();
		return json({ 
			message: 'Redis store initialized successfully', 
			count: projects.length,
			projects 
		});
	} catch (error) {
		return json({ error: 'Failed to initialize Redis store' }, { status: 500 });
	}
};
