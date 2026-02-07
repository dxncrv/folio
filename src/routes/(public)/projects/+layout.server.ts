import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    // Prefetch project list in layout to share with children and speed up initial render
    console.log('[Projects Layout] Fetching projects from PocketBase...');
    try {
        // Optimization: Use getFullList with skipTotal for performance
        const items = await locals.pb.collection('projects').getFullList({
            sort: '+order,-id',
            skipTotal: true,
            requestKey: 'projects-layout' // Deduplicate concurrent loads
        });
        console.log(`[Projects Layout] Fetched ${items.length} projects`);
        return { 
            projects: items 
        };
    } catch (error) {
        console.error('[Projects Layout] Load failed:', error);
        return { projects: [] };
    }
};
