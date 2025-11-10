// Response interface from status API
interface ServerStatusEvent {
	status: 'online' | 'offline' | 'connecting';
	timestamp: string;
	service?: string;
	error?: string;
}

/**
 * Reactive Svelte 5 store for _svr status.
 * Polls /api/_svr/status every 30s when visible, with 30s connection timeout.
 */
class ServerStatusStore {
	status = $state<'online' | 'offline' | 'connecting'>('connecting');
	lastChecked = $state<string | null>(null);
	error = $state<string | null>(null);
	connectionStartTime = $state<number | null>(null);

	private pollInterval: ReturnType<typeof setInterval> | null = null;
	private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
	private readonly POLL_INTERVAL = 30000;
	private readonly CONNECTION_TIMEOUT = 30000;

	private setupConnectionTimeout(): void {
		if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
		this.connectionStartTime = Date.now();
		this.connectionTimeout = setTimeout(() => {
			if (this.status === 'connecting') {
				console.log('[Status] Connection timeout - offline');
				this.status = 'offline';
				this.error = 'Connection timeout';
				this.setPolling(false);
			}
		}, this.CONNECTION_TIMEOUT);
	}

	private setPolling = (active: boolean): void => {
		if (active && !this.pollInterval) {
			this.pollInterval = setInterval(() => {
				if (typeof document === 'undefined' || !document.hidden) this.fetchStatus();
			}, this.POLL_INTERVAL);
		} else if (!active && this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	};

	async connect(): Promise<void> {
		this.setupConnectionTimeout();
		await this.fetchStatus();
		this.setPolling(true);
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', this.handleVisibilityChange);
		}
	}

	private handleVisibilityChange = (): void => {
		if (typeof document === 'undefined') return;
		document.hidden ? this.setPolling(false) : (this.fetchStatus(), this.setPolling(true),
			(this.status === 'connecting' || (this.status === 'offline' && this.error === 'Connection timeout')) && this.setupConnectionTimeout());
	};

	private async fetchStatus(): Promise<void> {
		try {
			const response = await fetch('/api/_svr/status');
			if (response.ok) {
				const data: ServerStatusEvent = await response.json();
				this.status = data.status;
				this.lastChecked = data.timestamp;
				this.error = data.error || null;
				if (data.status !== 'connecting') this.clearConnectionTimeout();
			} else throw new Error(`HTTP ${response.status}`);
		} catch (error) {
			console.error('[Status] Fetch error:', error);
			this.status = 'offline';
			this.error = error instanceof Error ? error.message : 'Failed to fetch status';
		}
	}

	private clearConnectionTimeout(): void {
		if (this.connectionTimeout) {
			clearTimeout(this.connectionTimeout);
			this.connectionTimeout = null;
		}
	}

	disconnect(): void {
		this.setPolling(false);
		this.clearConnectionTimeout();
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', this.handleVisibilityChange);
		}
	}
}

// Export singleton instance
export const serverStatus = new ServerStatusStore();