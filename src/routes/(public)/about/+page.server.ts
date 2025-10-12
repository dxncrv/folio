import type { PageServerLoad } from './$types';

// Eager loading ensures content is available at build time for SSR
const markdownFiles = import.meta.glob('./blocks/*.md', { 
	query: '?raw', 
	eager: true,
	import: 'default'
}) as Record<string, string>;

export const load: PageServerLoad = async () => {
	// Extract markdown content from glob imports
	return {
		markdownContent: {
			hello: markdownFiles['./blocks/hello.md'] || '',
			resume: markdownFiles['./blocks/resume.md'] || ''
		}
	};
};
