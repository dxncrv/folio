import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createPBClient } from '$lib/server/pb';

const pbClient: Handle = async ({ event, resolve }) => {
	// Create a per-request PocketBase client for data operations.
	// Auth is handled by withAdmin (superuser) and talk cookies — not PB auth store.
	event.locals.pb = createPBClient();
	return resolve(event);
};


const themeHandler: Handle = async ({ event, resolve }) => {
	let theme: string | undefined;
	try {
		const newTheme = event.url.searchParams.get('theme');
		const cookieTheme = event.cookies.get('theme');
		theme = newTheme || cookieTheme || 'dark';
	} catch {
		theme = event.cookies.get('theme') || 'dark';
	}
	// Always inject theme (default to 'dark' for prerendered pages)
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('data-theme=""', `data-theme="${theme}"`)
	});
};

export const handle = sequence(pbClient, themeHandler) satisfies Handle;
