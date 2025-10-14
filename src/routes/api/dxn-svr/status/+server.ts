// Context7: /llmstxt/svelte_dev_llms-full_txt - SvelteKit server endpoint
import { json } from '@sveltejs/kit';
import { SERVER_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

interface ServerResponse {
	status: 'online' | 'offline';
	timestamp: string;
	service: string;
}

export const GET: RequestHandler = async () => {
	if (!SERVER_URL) {
		return json(
			{
				status: 'offline',
				error: 'Server URL not configured',
				timestamp: new Date().toISOString()
			},
			{ status: 503 }
		);
	}

	try {
		const response = await fetch(SERVER_URL, {
			method: 'GET',
			signal: AbortSignal.timeout(5000),
			headers: {
				'ngrok-skip-browser-warning': 'true'
			}
		});

		if (response.ok) {
			const data: ServerResponse = await response.json();
			return json({
				status: data.status,
				timestamp: data.timestamp,
				service: data.service
			});
		}

		return json(
			{
				status: 'offline',
				error: `Server returned ${response.status}`,
				timestamp: new Date().toISOString()
			},
			{ status: response.status }
		);
	} catch (error) {
		return json(
			{
				status: 'offline',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 503 }
		);
	}
};
