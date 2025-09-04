import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/server/redis.server';
import type { CaseStudy } from '$lib/server/redis.server';
import type { RequestHandler } from './$types';

// GET: Fetch all case studies
export const GET: RequestHandler = async () => {
    try {
        const caseStudies = await RedisStore.getCaseStudies();
        return json(caseStudies);
    } catch (error) {
        return json({ error: 'Failed to fetch case studies' }, { status: 500 });
    }
};

// POST: Create a new case study
export const POST: RequestHandler = async ({ request }) => {
    try {
        const caseStudy: CaseStudy = await request.json();
        if (!caseStudy.slug || !caseStudy.content) {
            return json({ error: 'Invalid case study data' }, { status: 400 });
        }
        const caseStudies = await RedisStore.addCaseStudy(caseStudy);
        return json(caseStudies, { status: 201 });
    } catch (error) {
        return json({ error: 'Failed to create case study' }, { status: 500 });
    }
};
