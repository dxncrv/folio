import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearMessages } from '$lib/server/talk.server';
import { isAuthorizedWrite } from '$lib/server/security.server';

/**
 * DELETE /api/talk/admin
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
