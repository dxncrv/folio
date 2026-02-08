import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    try {
        const items = await locals.pb.collection('projects').getFullList({
            sort: '+order,-id',
            skipTotal: true,
            requestKey: 'projects-layout'
        });
        return { projects: items };
    } catch (error) {
        console.error('[Projects Layout] Load failed:', error);
        return { projects: [] };
    }
};
