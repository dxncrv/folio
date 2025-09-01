import type { Handle } from '@sveltejs/kit';
import { isIPWhitelisted } from '$lib/config/whitelist';
import { error } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
	// IP Whitelisting for admin dashboard
	if (event.url.pathname.startsWith('/dash')) {
		const clientIP = event.getClientAddress();

		// Log attempted access
		console.log(`Dashboard access attempt from IP: ${clientIP}`);

		if (!isIPWhitelisted(clientIP)) {
			console.warn(`❌ BLOCKED: Unauthorized access attempt to /dash from IP: ${clientIP}`);
			throw error(403, 'Access denied: Your IP address is not authorized to access this resource.');
		}
		
		// Log authorized access
		console.log(`✅ ALLOWED: Authorized access to /dash from IP: ${clientIP}`);
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
