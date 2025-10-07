import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSettings } from '$lib/server/talk.server';

/**
 * GET /api/talk/settings
 * Get chat settings (polling mode, etc.)
 */
export const GET: RequestHandler = async () => {
    try {
        const settings = await getSettings();
        return json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
};
