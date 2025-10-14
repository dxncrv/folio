import { SERVER_URL } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * SSE endpoint that streams server status updates to connected clients.
 * Uses EventSource protocol (text/event-stream).
 */
export const GET: RequestHandler = async () => {
	const stream = new ReadableStream({
		async start(controller) {
			const CHECK_INTERVAL = 5000;
			let intervalId: NodeJS.Timeout;
			let isClosed = false;

			const sendEvent = (data: object) => {
				if (isClosed) return;
				try {
					controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
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

			await checkStatus();
			intervalId = setInterval(checkStatus, CHECK_INTERVAL);

			return () => {
				isClosed = true;
				clearInterval(intervalId);
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
