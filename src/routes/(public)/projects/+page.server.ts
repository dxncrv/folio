import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
    // Rely on parent layout to provide the projects list
    const { projects } = await parent();
    return { projects };
};
