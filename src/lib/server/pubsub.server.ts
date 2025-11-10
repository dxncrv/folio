/**
 * Shared Redis Pub/Sub Manager
 * Single subscriber connection broadcasts to multiple SSE clients via EventEmitter
 * Eliminates N Redis connections for N SSE clients
 */
import Redis from 'ioredis';
import { EventEmitter } from 'node:events';
import { env } from '$env/dynamic/private';
import { CHANNEL, type MessageEvent } from './message-service.server';

class PubSubManager extends EventEmitter {
	private subscriber: Redis | null = null;
	private clientCount = 0;
	private connecting = false;

	async subscribe(): Promise<void> {
		this.clientCount++;
		
		if (this.subscriber?.status === 'ready') {
			return; // Already connected
		}
		
		if (this.connecting) {
			// Wait for existing connection
			await new Promise(resolve => {
				const check = setInterval(() => {
					if (this.subscriber?.status === 'ready') {
						clearInterval(check);
						resolve(undefined);
					}
				}, 50);
			});
			return;
		}
		
		this.connecting = true;
		
		try {
			this.subscriber = new Redis(env.REDIS_URL!, {
				lazyConnect: false,
				enableReadyCheck: true
			});
			
			this.subscriber.on('message', (channel: string, message: string) => {
				if (channel === CHANNEL) {
					try {
						const event: MessageEvent = JSON.parse(message);
						this.emit('message', event);
					} catch (e) {
						console.error('[PubSub] Parse error:', e);
					}
				}
			});
			
			this.subscriber.on('error', (err) => {
				console.error('[PubSub] Subscriber error:', err);
			});
			
			await this.subscriber.subscribe(CHANNEL);
			console.log('[PubSub] Shared subscriber connected');
		} catch (e) {
			console.error('[PubSub] Connection failed:', e);
			this.subscriber = null;
			throw e;
		} finally {
			this.connecting = false;
		}
	}

	unsubscribe(): void {
		this.clientCount--;
		
		if (this.clientCount <= 0 && this.subscriber) {
			console.log('[PubSub] No more listeners, closing subscriber');
			this.subscriber.quit();
			this.subscriber = null;
			this.clientCount = 0;
		}
	}

	getSubscriber(): Redis | null {
		return this.subscriber;
	}
}

// Singleton instance
const pubsubManager = new PubSubManager();

export { pubsubManager };
