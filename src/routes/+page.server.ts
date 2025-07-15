import type { Actions } from '@sveltejs/kit';

const allowedThemes = ['light', 'dark'];

export const actions: Actions = {
	setTheme: async ({ url, cookies }) => {
		const theme = url.searchParams.get('theme');

		if (theme && allowedThemes.includes(theme)) {
			cookies.set('theme', theme, {
				path: '/',
				maxAge: 60 * 60 * 24 * 365 // 1 year
			});
		}
	}
};
