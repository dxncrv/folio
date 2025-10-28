import { getRedisClient } from '$lib/server/redis.server';
import Redis from 'ioredis';
import { env } from '$env/dynamic/private';

const REDIS_CHANNEL = 'dxn-svr:status';
const REDIS_STATUS_KEY = 'dxn-svr:current-status';

interface StatusMessage {
	status: 'online' | 'offline' | 'connecting';
	timestamp: string;
	service?: string;
	error?: string;
}

/**
 * SSE endpoint that streams server status updates using Redis pub/sub.
 * NO POLLING - updates are event-driven via Redis pub/sub.
 * 
 * Architecture:
 * 1. Client connects via EventSource
 * 2. Server sends current status from Redis immediately
 * 3. Server subscribes to Redis channel
 * 4. When webhook publishes to Redis, this stream broadcasts to client
 * 5. Heartbeat comments keep connection alive
 */
export const GET = async () => {
	const stream = new ReadableStream({
		async start(controller) {
			let isClosed = false;
			let pubSubClient: Redis | null = null;
			let heartbeatInterval: NodeJS.Timeout | null = null;

			const sendEvent = (data: StatusMessage) => {
				if (isClosed) return;
				try {
					controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
				} catch {
					isClosed = true;
				}
			};

			const sendKeepAlive = () => {
				if (isClosed) return;
				try {
					controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
				} catch {
					isClosed = true;
				}
			};

			try {
				const redisClient = getRedisClient();

				// Send current status immediately
				const currentStatus = await redisClient.get(REDIS_STATUS_KEY);
				if (currentStatus) {
					sendEvent(JSON.parse(currentStatus));
				} else {
					// No status in Redis yet
					sendEvent({
						status: 'connecting',
						timestamp: new Date().toISOString()
					});
				}

				// Create dedicated Redis client for pub/sub
				if (!env.REDIS_URL || env.REDIS_URL === 'your_redis_url_here') {
					throw new Error('Redis not configured');
				}

				pubSubClient = new Redis(env.REDIS_URL, {
					lazyConnect: false,
					maxRetriesPerRequest: 3
				});

				// Subscribe to status updates
				await pubSubClient.subscribe(REDIS_CHANNEL);

				pubSubClient.on('message', (channel, message) => {
					if (channel === REDIS_CHANNEL && !isClosed) {
						try {
							const status: StatusMessage = JSON.parse(message);
							sendEvent(status);
						} catch (err) {
							console.error('[SSE] Failed to parse Redis message:', err);
						}
					}
				});

				// Send keepalive every 15 seconds
				heartbeatInterval = setInterval(sendKeepAlive, 15000);

			} catch (error) {
				console.error('[SSE] Setup error:', error);
				sendEvent({
					status: 'offline',
					error: error instanceof Error ? error.message : 'Setup failed',
					timestamp: new Date().toISOString()
				});
			}

			// Cleanup function
			return () => {
				isClosed = true;
				if (heartbeatInterval) clearInterval(heartbeatInterval);
				if (pubSubClient) {
					pubSubClient.unsubscribe(REDIS_CHANNEL);
					pubSubClient.quit();
				}
			};
		},

		cancel() {
			console.log('[SSE] Client disconnected');
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no' // Disable buffering in nginx
		}
	});
};
