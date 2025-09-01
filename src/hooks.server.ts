import type { Handle } from '@sveltejs/kit';
import { isIPWhitelisted } from '$lib/config/whitelist';
import { error } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
	// IP Whitelisting for admin dashboard
	if (event.url.pathname.startsWith('/dash')) {
		// Get client IP with fallback for Vercel deployment
		let clientIP = event.getClientAddress();
		
		// On Vercel, check for forwarded headers
		const forwardedFor = event.request.headers.get('x-forwarded-for');
		const realIP = event.request.headers.get('x-real-ip');
		
		// Use the first IP from x-forwarded-for if available (most accurate on Vercel)
		if (forwardedFor) {
			clientIP = forwardedFor.split(',')[0].trim();
		} else if (realIP) {
			clientIP = realIP;
		}

		// Log attempted access with all relevant headers for debugging
		console.log(`Dashboard access attempt from IP: ${clientIP}`);
		console.log(`Headers - X-Forwarded-For: ${forwardedFor}, X-Real-IP: ${realIP}`);
		console.log(`getClientAddress(): ${event.getClientAddress()}`);

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
