// Response interface from dxn-svr SSE stream
interface ServerStatusEvent {
	status: 'online' | 'offline';
	timestamp: string;
	service?: string;
	error?: string;
}

/**
 * Reactive Svelte 5 store for remote server status using EventSource (SSE).
 * Context7: /sveltejs/svelte@5.37.0 - Optimized lifecycle with exponential backoff + visibility-aware
 */
class ServerStatusStore {
	status = $state<'online' | 'offline' | 'connecting'>('connecting');
	lastChecked = $state<string | null>(null);
	error = $state<string | null>(null);

	private eventSource: EventSource | null = null;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	
	// Exponential backoff config
	private reconnectAttempts = 0;
	private readonly BASE_DELAY = 1000;
	private readonly MAX_DELAY = 30000;
	private readonly BACKOFF_THRESHOLD = 3; // Switch to visibility-aware after N failures
	
	// Visibility-aware mode
	private visibilityAwareMode = false;
	private visibilityHandler: (() => void) | null = null;

	connect(): void {
		// Don't reconnect if already connected or connecting
		if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
			return;
		}

		// Visibility-aware: only connect if page visible
		if (this.visibilityAwareMode && typeof document !== 'undefined' && document.hidden) {
			// Deferred: page hidden
			this.setupVisibilityHandler();
			return;
		}

		this.disconnect();
		this.status = 'connecting';
		this.error = null;

		try {
			this.eventSource = new EventSource('/api/dxn-svr/stream');

			this.eventSource.onopen = () => {
				this.error = null;
				this.reconnectAttempts = 0; // Reset backoff on successful connection
			};

			this.eventSource.onmessage = ({ data }: MessageEvent) => {
				try {
					const parsed: ServerStatusEvent = JSON.parse(data);
					this.status = parsed.status;
					this.lastChecked = parsed.timestamp;
					this.error = parsed.error || null;
				} catch {
					// Parse error
				}
			};

			this.eventSource.onerror = (event) => {
				// On Vercel, SSE connections close after ~25s. Don't mark as error, just reconnect.
				this.disconnect();
				this.scheduleReconnect();
			};
		} catch (error) {
			this.status = 'offline';
			this.error = error instanceof Error ? error.message : 'Connection failed';
			this.scheduleReconnect();
		}
		
		// Setup visibility handler if in visibility-aware mode
		if (this.visibilityAwareMode) {
			this.setupVisibilityHandler();
		}
	}

	disconnect(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		this.eventSource?.close();
		this.eventSource = null;
		this.cleanupVisibilityHandler();
	}

	private scheduleReconnect(): void {
		if (this.reconnectTimeout) return;
		
		this.reconnectAttempts++;
		
		// Switch to visibility-aware mode after threshold
		if (this.reconnectAttempts >= this.BACKOFF_THRESHOLD && !this.visibilityAwareMode) {
			this.visibilityAwareMode = true;
		}
		
		// Calculate exponential backoff delay
		const delay = Math.min(
			this.BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1),
			this.MAX_DELAY
		);
		
		this.reconnectTimeout = setTimeout(() => {
			this.reconnectTimeout = null;
			this.connect();
		}, delay);
	}

	private setupVisibilityHandler(): void {
		if (this.visibilityHandler || typeof document === 'undefined') return;
		
		this.visibilityHandler = () => {
			if (document.hidden) {
				this.disconnect();
			} else {
				this.connect();
			}
		};
		
		document.addEventListener('visibilitychange', this.visibilityHandler);
	}

	private cleanupVisibilityHandler(): void {
		if (this.visibilityHandler && typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', this.visibilityHandler);
			this.visibilityHandler = null;
		}
	}

	get isConnected(): boolean {
		return this.eventSource?.readyState === EventSource.OPEN;
	}
}

// Export singleton instance
export const serverStatus = new ServerStatusStore();