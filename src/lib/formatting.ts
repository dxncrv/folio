/**
 * Convert a string to URL-friendly slug format
 * 
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * 
 * @param str - Input string
 * @returns Slugified string
 * 
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("My Project 2024") // "my-project-2024"
 */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}
