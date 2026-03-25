import type { LayoutServerLoad } from './$types';
import { getCachedProjects, setCachedProjects } from '$lib/server/projects-cache.server';

export const load: LayoutServerLoad = async ({ locals }) => {
    const cached = getCachedProjects();
    if (cached) {
        // Cache hit: return immediately — full SSR in one shot, no streaming needed.
        return { projects: cached };
    }

    // Cache miss: return the PocketBase query as an unresolved Promise.
    // SvelteKit streams the page shell to the browser immediately;
    // the projects fill in when the query resolves (skeleton shown in the meantime).
    // Per SvelteKit docs: non-SvelteKit-fetch promises need error handlers to be marked as handled.
    const projectsPromise = locals.pb.collection('projects').getFullList({
        sort: '+order,-id',
        skipTotal: true,
        requestKey: 'projects-layout'
    }).then(items => {
        setCachedProjects(items);
        return items;
    }).catch(error => {
        console.error('[Projects Layout] PocketBase query failed (all retries exhausted):', error);
        // Mark as handled per SvelteKit streaming docs; component $effect catches for graceful UI
        throw error;
    });

    return { projects: projectsPromise };
};
