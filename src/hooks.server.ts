import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createPBClient } from '$lib/server/pb';

const authentication: Handle = async ({ event, resolve }) => {
	console.log(`[Request] ${event.request.method} ${event.url.pathname}`);
	event.locals.pb = createPBClient();

	// load the store data from the request cookie string
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		// get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
		if (event.locals.pb.authStore.isValid) {
			console.log(`[Auth] refreshing session for: ${event.locals.pb.authStore.model?.email}`);
			await event.locals.pb.collection('users').authRefresh();
		}
	} catch (err) {
		console.error(`[Auth] refresh failed:`, err);
		// clear the auth store on failed refresh
		event.locals.pb.authStore.clear();
	}

	event.locals.user = event.locals.pb.authStore.record;

	const response = await resolve(event);

	// send back the default 'pb_auth' cookie to the client with the latest store state
	response.headers.append('set-cookie', event.locals.pb.authStore.exportToCookie({ httpOnly: false }));

	return response;
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

export const handle = sequence(authentication, themeHandler) satisfies Handle;
