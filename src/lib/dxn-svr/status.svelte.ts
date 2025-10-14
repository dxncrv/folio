// Response interface from dxn-svr SSE stream
interface ServerStatusEvent {
	status: 'online' | 'offline';
	timestamp: string;
	service?: string;
	error?: string;
}

/**
 * Reactive Svelte 5 store for remote server status using EventSource (SSE).
 */
class ServerStatusStore {
	status = $state<'online' | 'offline' | 'connecting'>('connecting');
	lastChecked = $state<string | null>(null);
	error = $state<string | null>(null);

	private eventSource: EventSource | null = null;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private readonly RECONNECT_DELAY = 3000;

	connect(): void {
		this.disconnect();
		this.status = 'connecting';
		this.error = null;

		try {
			this.eventSource = new EventSource('/api/dxn-svr/stream');

			this.eventSource.onopen = () => (this.error = null);

			this.eventSource.onmessage = ({ data }: MessageEvent) => {
				try {
					const parsed: ServerStatusEvent = JSON.parse(data);
					this.status = parsed.status;
					this.lastChecked = parsed.timestamp;
					this.error = parsed.error || null;
				} catch {
					console.error('[ServerStatus] Failed to parse SSE message');
				}
			};

			this.eventSource.onerror = () => {
				this.status = 'offline';
				this.error = 'Connection error';
				this.disconnect();
				this.scheduleReconnect();
			};
		} catch (error) {
			this.status = 'offline';
			this.error = error instanceof Error ? error.message : 'Connection failed';
			this.scheduleReconnect();
		}
	}

	disconnect(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		this.eventSource?.close();
		this.eventSource = null;
	}

	private scheduleReconnect(): void {
		if (this.reconnectTimeout) return;
		this.reconnectTimeout = setTimeout(() => {
			this.reconnectTimeout = null;
			this.connect();
		}, this.RECONNECT_DELAY);
	}

	get isConnected(): boolean {
		return this.eventSource?.readyState === EventSource.OPEN;
	}
}

// Export singleton instance
export const serverStatus = new ServerStatusStore();