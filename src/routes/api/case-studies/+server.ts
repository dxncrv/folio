import { json } from '@sveltejs/kit';
import { RedisStore } from '$lib/server/redis.server';
import { isAdminRequest } from '$lib/server/admin.server';
import { sanitizeMarkdownForStorage, isRateLimited, getClientIPFromRequest } from '$lib/server/security.server';
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
        // Rate limiting per IP
        const ip = getClientIPFromRequest(request);
        if (isRateLimited(ip)) return json({ error: 'Too many requests' }, { status: 429 });

        if (!isAdminRequest(request)) {
            return json({ error: 'Forbidden' }, { status: 403 });
        }

        const caseStudy: CaseStudy = await request.json();
        if (!caseStudy.slug || !caseStudy.content) {
            return json({ error: 'Invalid case study data' }, { status: 400 });
        }

        // Sanitize markdown before storing to prevent raw HTML from being saved
        caseStudy.content = sanitizeMarkdownForStorage(caseStudy.content);

        const caseStudies = await RedisStore.addCaseStudy(caseStudy);
        return json(caseStudies, { status: 201 });
    } catch (error) {
        return json({ error: 'Failed to create case study' }, { status: 500 });
    }
};
