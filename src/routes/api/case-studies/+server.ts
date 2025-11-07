import { RedisStore, withHandler, withAdmin } from '$lib/server';
import type { CaseStudy } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = withHandler(async () => {
    return await RedisStore.getCaseStudies();
});

export const POST: RequestHandler = withAdmin(async ({ request }) => {
    const caseStudy: CaseStudy = await request.json();
    if (!caseStudy.slug || !caseStudy.content) return { error: 'Invalid case study data' } as any;
    const caseStudies = await RedisStore.addCaseStudy(caseStudy);
    return caseStudies;
});
