import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    // Prefetch project list in layout to share with children and speed up initial render
    console.log('[Projects Layout] Fetching projects from PocketBase...');
    try {
        const result = await locals.pb.collection('projects').getList(1, 100, {
            sort: '+order,-id'
        });
        console.log(`[Projects Layout] Fetched ${result.items.length} projects`);
        return { 
            projects: result.items 
        };
    } catch (error) {
        console.error('[Projects Layout] Load failed:', error);
        return { projects: [] };
    }
};
