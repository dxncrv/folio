// Response interface from status API
interface ServerStatusEvent {
	status: 'online' | 'offline' | 'connecting';
	timestamp: string;
	service?: string;
	error?: string;
}

/**
 * Reactive Svelte 5 store for dxn-svr status.
 * Simple client-side polling of Redis-backed status endpoint.
 * 
 * Architecture:
 * 1. dxn-svr sends webhook to /api/dxn-svr/webhook (writes to Redis)
 * 2. Frontend polls /api/dxn-svr/status every 30s (reads from Redis, < 50ms)
 * 3. No SSE, no pub/sub, no Vercel timeout issues
 */
class ServerStatusStore {
	status = $state<'online' | 'offline' | 'connecting'>('connecting');
	lastChecked = $state<string | null>(null);
	error = $state<string | null>(null);

	private pollInterval: NodeJS.Timeout | null = null;
	private readonly POLL_INTERVAL = 30000; // 30 seconds

	async connect(): Promise<void> {
		// Fetch immediately
		await this.fetchStatus();
		
		// Then poll every 30 seconds
		if (!this.pollInterval) {
			this.pollInterval = setInterval(() => {
				this.fetchStatus();
			}, this.POLL_INTERVAL);
		}
	}

	private async fetchStatus(): Promise<void> {
		try {
			const response = await fetch('/api/dxn-svr/status');
			if (response.ok) {
				const data: ServerStatusEvent = await response.json();
				this.status = data.status;
				this.lastChecked = data.timestamp;
				this.error = data.error || null;
			} else {
				throw new Error(`HTTP ${response.status}`);
			}
		} catch (error) {
			console.error('[Status] Fetch error:', error);
			this.status = 'offline';
			this.error = error instanceof Error ? error.message : 'Failed to fetch status';
		}
	}

	disconnect(): void {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}
}

// Export singleton instance
export const serverStatus = new ServerStatusStore();