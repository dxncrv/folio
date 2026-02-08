import { withAdmin } from '$lib/server';
import type { Project } from '$lib/types';
import type { RequestHandler } from './$types';

async function findByTitle(pb: any, title: string) {
	try {
		// Escape quotes in title for filter string
		const safeTitle = title.replace(/"/g, '\\"');
		return await pb.collection('projects').getFirstListItem(`title="${safeTitle}"`);
	} catch {
		return null;
	}
}

export const PUT: RequestHandler = withAdmin(async ({ params, request, locals }) => {
	const title = decodeURIComponent(params.title ?? '');
	const record = await findByTitle(locals.pb, title);
	
	if (!record) {
		return { error: 'Project not found', status: 404 } as any;
	}

	const updatedProject: Project = await request.json();
	await locals.pb.collection('projects').update(record.id, updatedProject);
	
	return await locals.pb.collection('projects').getFullList({ sort: '+order,-id', expand: 'studies', skipTotal: true });
});

export const DELETE: RequestHandler = withAdmin(async ({ params, locals }) => {
	const title = decodeURIComponent(params.title ?? '');
	const record = await findByTitle(locals.pb, title);
	
	if (record) {
		await locals.pb.collection('projects').delete(record.id);
	}
	return await locals.pb.collection('projects').getFullList({ sort: '+order,-id', expand: 'studies', skipTotal: true });
});
