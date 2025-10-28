import { json } from '@sveltejs/kit';
import { getRedisClient } from '$lib/server/redis.server';

const REDIS_STATUS_KEY = 'dxn-svr:current-status';

interface StatusMessage {
	status: 'online' | 'offline' | 'connecting';
	timestamp: string;
	service?: string;
	error?: string;
}

/**
 * Simple status endpoint that reads from Redis.
 * Fast execution (< 50ms), no timeout issues.
 * Frontend polls this every 30 seconds.
 */
export const GET = async () => {
	try {
		const redis = getRedisClient();
		const currentStatus = await redis.get(REDIS_STATUS_KEY);
		
		if (currentStatus) {
			const status: StatusMessage = JSON.parse(currentStatus);
			return json(status);
		}
		
		// No status in Redis yet
		return json({
			status: 'connecting',
			timestamp: new Date().toISOString()
		} as StatusMessage);
		
	} catch (error) {
		console.error('[Status] Error fetching status:', error);
		return json(
			{
				status: 'offline',
				error: error instanceof Error ? error.message : 'Failed to fetch status',
				timestamp: new Date().toISOString()
			} as StatusMessage,
			{ status: 500 }
		);
	}
};
