/**
 * General Utilities
 * 
 * Utilities for common operations like theme management.
 * For specific domains, see:
 * - markdown.ts for markdown parsing
 * - formatting.ts for string formatting
 */

import type { SubmitFunction } from '@sveltejs/kit';

/**
 * Submit function that updates the document theme attribute
 * Used with SvelteKit form actions for theme switching
 */
export const updateTheme: SubmitFunction = ({ action }) => {
	const theme = action.searchParams.get('theme');

	if (theme) {
		document.documentElement.setAttribute('data-theme', theme);
	}
};