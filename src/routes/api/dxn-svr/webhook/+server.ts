import { json } from '@sveltejs/kit';
import { getRedisClient } from '$lib/server/redis.server';
import { withHandler } from '$lib/server/api-utils.server';
import { env } from '$env/dynamic/private';

const REDIS_STATUS_KEY = 'dxn-svr:current-status';
const STATUS_TTL = 300; // 5 minutes

interface WebhookPayload {
	status: 'online' | 'offline';
	timestamp: string;
	service?: string;
}

interface StatusMessage extends WebhookPayload {
	error?: string;
}

/**
 * Webhook endpoint for dxn-svr to report status changes
 * 
 * Called by dxn-svr on startup (status: 'online') and shutdown (status: 'offline')
 * Simply stores status in Redis - no pub/sub needed
 * 
 * Architecture:
 * 1. Validate webhook secret
 * 2. Store status in Redis with TTL
 * 3. Frontend polls this status every 30s
 */
export const POST = withHandler(async ({ request }) => {
	// Validate webhook secret
	const secret = request.headers.get('x-webhook-secret');
	const expectedSecret = env.DXN_SVR_WEBHOOK_SECRET;

	if (!expectedSecret) {
		console.error('[Webhook] DXN_SVR_WEBHOOK_SECRET not configured');
		return json({ error: 'Webhook not configured' }, { status: 503 });
	}

	if (!secret || secret !== expectedSecret) {
		console.warn('[Webhook] Unauthorized webhook attempt');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Parse and validate payload
	let payload: WebhookPayload;
	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	if (!payload.status || !['online', 'offline'].includes(payload.status)) {
		return json({ error: 'Invalid status. Must be "online" or "offline"' }, { status: 400 });
	}

	if (!payload.timestamp) {
		return json({ error: 'Missing timestamp' }, { status: 400 });
	}

	// Create status message
	const statusMessage: StatusMessage = {
		status: payload.status,
		timestamp: payload.timestamp,
		service: payload.service || 'dxn-svr'
	};

	const messageJson = JSON.stringify(statusMessage);

	try {
		const redis = getRedisClient();

		// Store current status in Redis with TTL (5 minutes)
		await redis.set(REDIS_STATUS_KEY, messageJson, 'EX', STATUS_TTL);

		console.log(`[Webhook] Status update: ${payload.status}`);

		return json({
			success: true,
			status: payload.status
		});
	} catch (error) {
		console.error('[Webhook] Redis error:', error);
		return json({ error: 'Failed to process webhook' }, { status: 500 });
	}
});
