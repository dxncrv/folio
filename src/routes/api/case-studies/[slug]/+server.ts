import { RedisStore, withHandler, withAdmin } from '$lib/server';
import type { CaseStudy } from '$lib/types';

// GET: Fetch a specific case study by slug
export const GET = withHandler(async (event) => {
    const slug = event.params.slug ?? '';
    const caseStudies = await RedisStore.getCaseStudies();
    const caseStudy = caseStudies.find(cs => cs.slug === slug);
    if (!caseStudy) return Promise.reject(new Error('Case study not found'));
    return caseStudy;
});

export const PUT = withAdmin(async (event) => {
    const slug = event.params.slug ?? '';
    const updated: CaseStudy = await event.request.json();
    if (!updated.slug || !updated.content) return { error: 'Invalid case study data' } as any;
    const caseStudies = await RedisStore.updateCaseStudy(slug, updated);
    return caseStudies;
});

export const DELETE = withAdmin(async (event) => {
    const slug = event.params.slug ?? '';
    const caseStudies = await RedisStore.deleteCaseStudy(slug);
    return caseStudies;
});
