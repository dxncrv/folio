import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/server/redis.server';
import { isAuthorizedWrite } from '$lib/server/security.server';
import type { CaseStudy } from '$lib/server/redis.server';
import type { RequestEvent } from '@sveltejs/kit';

// GET: Fetch a specific case study by slug
export const GET = async (event: RequestEvent) => {
    try {
    const slug = event.params.slug ?? '';
        const caseStudies = await RedisStore.getCaseStudies();
        const caseStudy = caseStudies.find(cs => cs.slug === slug);
        if (!caseStudy) {
            return json({ error: 'Case study not found' }, { status: 404 });
        }
        return json(caseStudy);
    } catch (error) {
        return json({ error: 'Failed to fetch case study' }, { status: 500 });
    }
};

// PUT: Update a specific case study
export const PUT = async (event: RequestEvent) => {
    try {
    if (!(await isAuthorizedWrite(event.request))) return json({ error: 'Forbidden' }, { status: 403 });
    const slug = event.params.slug ?? '';
        const updated: CaseStudy = await event.request.json();
        if (!updated.slug || !updated.content) {
            return json({ error: 'Invalid case study data' }, { status: 400 });
        }

        const caseStudies = await RedisStore.updateCaseStudy(slug, updated);
        return json(caseStudies);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return json({ error: error.message }, { status: 404 });
        }
        return json({ error: 'Failed to update case study' }, { status: 500 });
    }
};

// DELETE: Delete a specific case study
export const DELETE = async (event: RequestEvent) => {
    try {
    if (!(await isAuthorizedWrite(event.request))) return json({ error: 'Forbidden' }, { status: 403 });
    const slug = event.params.slug ?? '';
        const caseStudies = await RedisStore.deleteCaseStudy(slug);
        return json(caseStudies);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return json({ error: error.message }, { status: 404 });
        }
        return json({ error: 'Failed to delete case study' }, { status: 500 });
    }
};
