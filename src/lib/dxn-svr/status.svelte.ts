// Context7: /llmstxt/svelte_dev_llms-full_txt - Svelte 5 $state rune for reactive state
import { PUBLIC_SERVER_URL } from '$env/static/public';

const SERVER_URL = PUBLIC_SERVER_URL || '';

// Response interface from dxn-svr
interface ServerResponse {
	status: 'online' | 'offline';
	timestamp: string;
	service: string;
}

// Svelte 5 rune: create reactive state singleton using $state
class ServerStatusStore {
	status = $state<'online' | 'offline' | 'checking'>('checking');
	lastChecked = $state<string | null>(null);
	error = $state<string | null>(null);

	async check(): Promise<boolean> {
		if (!SERVER_URL) {
			console.warn('[ServerStatus] No SERVER_URL configured');
			this.status = 'offline';
			this.error = 'No server URL configured';
			return false;
		}

		this.status = 'checking';
		this.error = null;

		try {
			const response = await fetch(SERVER_URL, {
				method: 'GET',
				signal: AbortSignal.timeout(5000), // 5 second timeout
				headers: {
					'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning page
				}
			});

			if (response.ok) {
				const data: ServerResponse = await response.json();
				console.log('[ServerStatus] Response:', data);
				
				if (data.status === 'online') {
					this.status = 'online';
					this.lastChecked = data.timestamp;
					return true;
				}
			}
			
			console.warn('[ServerStatus] Server returned non-ok response:', response.status);
			this.status = 'offline';
			this.error = `Server returned ${response.status}`;
			return false;
		} catch (error) {
			console.error('[ServerStatus] Check failed:', error);
			this.status = 'offline';
			this.error = error instanceof Error ? error.message : 'Unknown error';
			return false;
		}
	}
}

// Export singleton instance
export const serverStatus = new ServerStatusStore();