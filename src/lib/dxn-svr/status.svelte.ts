// Response interface from dxn-svr SSE stream
interface ServerStatusEvent {
	status: 'online' | 'offline' | 'connecting';
	timestamp: string;
	service?: string;
	error?: string;
}

/**
 * Reactive Svelte 5 store for remote server status using EventSource (SSE).
 * Context7: /sveltejs/svelte@5.37.0 - Event-driven updates via Redis pub/sub (no polling)
 */
class ServerStatusStore {
	status = $state<'online' | 'offline' | 'connecting'>('connecting');
	lastChecked = $state<string | null>(null);
	error = $state<string | null>(null);

	private eventSource: EventSource | null = null;
	private reconnectTimeout: NodeJS.Timeout | null = null;

	// Reconnection config
	private reconnectAttempts = 0;
	private readonly MAX_QUICK_RETRIES = 3;
	private readonly QUICK_RETRY_DELAY = 2000; // 2 seconds
	private readonly SLOW_RETRY_DELAY = 30000; // 30 seconds

	connect(): void {
		// Don't reconnect if already connected or connecting
		if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
			return;
		}

		this.disconnect();
		this.status = 'connecting';
		this.error = null;

		try {
			this.eventSource = new EventSource('/api/dxn-svr/stream');

			this.eventSource.onopen = () => {
				console.log('[SSE] Connected to dxn-svr status stream');
				this.error = null;
				this.reconnectAttempts = 0; // Reset on successful connection
			};

			this.eventSource.onmessage = ({ data }: MessageEvent) => {
				try {
					const parsed: ServerStatusEvent = JSON.parse(data);
					this.status = parsed.status;
					this.lastChecked = parsed.timestamp;
					this.error = parsed.error || null;
				} catch (err) {
					console.error('[SSE] Failed to parse message:', err);
				}
			};

			this.eventSource.onerror = (event) => {
				console.error('[SSE] Connection error');
				this.disconnect();
				this.scheduleReconnect();
			};
		} catch (error) {
			console.error('[SSE] Failed to create connection:', error);
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

		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
	}

	private scheduleReconnect(): void {
		if (this.reconnectTimeout) return;

		this.reconnectAttempts++;

		// Determine delay: quick retries first, then slow retry
		const delay =
			this.reconnectAttempts <= this.MAX_QUICK_RETRIES
				? this.QUICK_RETRY_DELAY
				: this.SLOW_RETRY_DELAY;

		console.log(`[SSE] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`);

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectTimeout = null;
			this.connect();
		}, delay);
	}

	get isConnected(): boolean {
		return this.eventSource?.readyState === EventSource.OPEN;
	}
}

// Export singleton instance
export const serverStatus = new ServerStatusStore();