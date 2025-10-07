import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearMessages, updateSettings } from '$lib/server/talk.server';
import { isAuthorizedWrite } from '$lib/server/security.server';

/**
 * DELETE /api/talk/admin/clear
 * Clear all messages (admin only)
 */
export const DELETE: RequestHandler = async ({ request }) => {
    const authorized = await isAuthorizedWrite(request);
    if (!authorized) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await clearMessages();
        return json({ success: true });
    } catch (error) {
        console.error('Error clearing messages:', error);
        return json({ error: 'Failed to clear messages' }, { status: 500 });
    }
};

/**
 * POST /api/talk/admin/settings
 * Update chat settings (admin only)
 */
export const POST: RequestHandler = async ({ request }) => {
    const authorized = await isAuthorizedWrite(request);
    if (!authorized) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const settings = await request.json();
        await updateSettings(settings);
        return json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        return json({ error: 'Failed to update settings' }, { status: 500 });
    }
};
