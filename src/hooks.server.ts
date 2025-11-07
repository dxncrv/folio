import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { error } from '@sveltejs/kit';
import { isIPWhitelisted } from '$lib/server';

function getClientIP(event: Parameters<Handle>[0]['event']): string {
    const h = event.request.headers;
    return (
        (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || event.getClientAddress() || '')
    ).trim();
}

const ipWhitelist: Handle = ({ event, resolve }) => {
    if (event.url.pathname.startsWith('/start')) {
        const clientIP = getClientIP(event);
        if (!clientIP || !isIPWhitelisted(clientIP)) {
            console.warn(`BLOCKED /start from ${clientIP}`);
            throw error(403, 'Access denied: You are not authorized.');
        }
        console.debug(`ALLOWED /start from ${clientIP}`);
    }
    return resolve(event);
};

const themeHandler: Handle = async ({ event, resolve }) => {
    const newTheme = event.url.searchParams.get('theme');
    const cookieTheme = event.cookies.get('theme');
    const theme = newTheme || cookieTheme;

    if (theme) {
        return resolve(event, {
            transformPageChunk: ({ html }) => html.replace('data-theme=""', `data-theme="${theme}"`)
        });
    }
    return resolve(event);
};

export const handle = sequence(ipWhitelist, themeHandler) satisfies Handle;
