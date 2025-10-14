import { SERVER_URL } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * SSE endpoint that streams server status updates to connected clients.
 * Uses EventSource protocol (text/event-stream).
 */
export const GET: RequestHandler = async () => {
	const stream = new ReadableStream({
		async start(controller) {
			const CHECK_INTERVAL = 10000; // 10s to reduce overhead
			const MAX_DURATION = 20000; // Close before Vercel's 25s timeout
			let intervalId: NodeJS.Timeout;
			let timeoutId: NodeJS.Timeout;
			let isClosed = false;

			const sendEvent = (data: object) => {
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
					// SSE comment keepalive (ignored by EventSource)
					controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
				} catch {
					isClosed = true;
				}
			};

			const sendError = (error: string) =>
				sendEvent({ status: 'offline', error, timestamp: new Date().toISOString() });

			const checkStatus = async () => {
				if (isClosed) return;

				if (!SERVER_URL) return sendError('Server URL not configured');

				try {
					const response = await fetch(SERVER_URL, {
						signal: AbortSignal.timeout(5000),
						headers: { 'ngrok-skip-browser-warning': 'true' }
					});

					if (response.ok) {
						const data = await response.json();
						sendEvent({
							status: data.status || 'online',
							timestamp: data.timestamp || new Date().toISOString(),
							service: data.service
						});
					} else {
						sendError(`Server returned ${response.status}`);
					}
				} catch (error) {
					sendError(error instanceof Error ? error.message : 'Unknown error');
				}
			};

			// Initial check
			await checkStatus();
			
			// Periodic checks with keepalive
			intervalId = setInterval(() => {
				sendKeepAlive();
				checkStatus();
			}, CHECK_INTERVAL);

			// Close gracefully before Vercel timeout
			timeoutId = setTimeout(() => {
				isClosed = true;
				clearInterval(intervalId);
				try {
					controller.close();
				} catch {
					// Connection already closed
				}
			}, MAX_DURATION);

			return () => {
				isClosed = true;
				clearInterval(intervalId);
				clearTimeout(timeoutId);
			};
		},

		cancel() {
			console.log('[SSE] Client disconnected');
		}
	});

	// SSE requires specific headers
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no' // Disable nginx buffering
		}
	});
};
