import type { Handle } from '@sveltejs/kit';
import { isIPWhitelisted } from '$lib/server/security.server';
import { error } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
	// IP Whitelisting for start page (compact)
	if (event.url.pathname.startsWith('/start')) {
		const h = event.request.headers;

		// prefer first entry of x-forwarded-for, then x-real-ip, then getClientAddress()
		const clientIP = (
			(h.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
			(h.get('x-real-ip') ?? '').trim() ||
			(event.getClientAddress() ?? '')
		).trim();

		if (!clientIP || !isIPWhitelisted(clientIP)) {
			// Log blocked access and throw error
			console.warn(`BLOCKED /start from ${clientIP}`);
			throw error(403, 'Access denied: You are not authorized to access this resource.');
		}

		// Log allowed access
		console.debug(`ALLOWED /start from ${clientIP}`);
	}

	// Theme handling
	let theme: string | null = null;

	const newTheme = event.url.searchParams.get('theme');
	const cookieTheme = event.cookies.get('theme');

	if (newTheme) {
		theme = newTheme;
	} else if (cookieTheme) {
		theme = cookieTheme;
	}

	if (theme) {
		return await resolve(event, {
			transformPageChunk: ({ html }) => html.replace('data-theme=""', `data-theme="${theme}"`)
		});
	}

	return await resolve(event);
}) satisfies Handle;
