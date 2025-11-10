/**
 * SSE stream for real-time message updates
 * Uses shared Redis subscriber via PubSubManager
 */
import type { RequestHandler } from './$types';
import type { MessageEvent } from '$lib/server';
import { pubsubManager } from '$lib/server/pubsub.server';

export const GET: RequestHandler = async ({ request }) => {
	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			let keepalive: ReturnType<typeof setInterval> | null = null;
			let cleaned = false;
			
			const cleanup = () => {
				if (cleaned) return;
				cleaned = true;
				
				if (keepalive) clearInterval(keepalive);
				pubsubManager.off('message', messageHandler);
				pubsubManager.unsubscribe();
				
				try {
					controller.close();
				} catch (e) {
					// Controller already closed, ignore
				}
			};
			
			// Handle incoming pub/sub messages from shared manager
			const messageHandler = (event: MessageEvent) => {
				if (cleaned) return;
				try {
					const data = JSON.stringify(event);
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				} catch (e) {
					console.error('[SSE] Error encoding message:', e);
				}
			};
			
			try {
				await pubsubManager.subscribe();
				pubsubManager.on('message', messageHandler);
				
				// Send keepalive every 30s
				keepalive = setInterval(() => {
					if (cleaned) return;
					try {
						controller.enqueue(encoder.encode(': keepalive\n\n'));
					} catch (e) {
						// Controller closed, cleanup
						cleanup();
					}
				}, 30000);
				
				// Cleanup on disconnect
				request.signal.addEventListener('abort', cleanup);
			} catch (e) {
				console.error('[SSE] Setup error:', e);
				cleanup();
				throw e;
			}
		}
	});
	
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};
