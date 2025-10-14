// Context7: /llmstxt/svelte_dev_llms-full_txt - Svelte 5 $state rune for reactive state

// Response interface from dxn-svr
interface ServerResponse {
	status: 'online' | 'offline';
	timestamp: string;
	service?: string;
	error?: string;
}

// Svelte 5 rune: create reactive state singleton using $state
class ServerStatusStore {
	status = $state<'online' | 'offline' | 'checking'>('checking');
	lastChecked = $state<string | null>(null);
	error = $state<string | null>(null);

	async check(): Promise<boolean> {
		this.status = 'checking';
		this.error = null;

		try {
			// Use internal API endpoint to proxy server check (keeps DXN_SERVER_URL private)
			const response = await fetch('/api/dxn-svr/status', {
				method: 'GET',
				signal: AbortSignal.timeout(5000)
			});

			const data: ServerResponse = await response.json();
			console.log('[ServerStatus] Response:', data);

			if (response.ok && data.status === 'online') {
				this.status = 'online';
				this.lastChecked = data.timestamp;
				return true;
			}

			console.warn('[ServerStatus] Server offline or error:', data.error || response.status);
			this.status = 'offline';
			this.error = data.error || `Server returned ${response.status}`;
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