// Imports
import type { SubmitFunction } from '@sveltejs/kit';

// Submit function, gets the theme from the form and sets it as the document theme
export const updateTheme: SubmitFunction = ({ action }) => {
	const theme = action.searchParams.get('theme');

	if (theme) {
		document.documentElement.setAttribute('data-theme', theme);
	}
};

// Function to slugify a string
export function slugify(str: string) {
	return str
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}
