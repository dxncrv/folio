import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    // Prefetch project list in layout to share with children and speed up initial render
    try {
        const result = await locals.pb.collection('projects').getList(1, 100, {
            sort: '+order,-id'
        });
        return { 
            projects: result.items 
        };
    } catch (error) {
        console.error('Layout load failed:', error);
        return { projects: [] };
    }
};
