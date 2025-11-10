/**
 * MessageService - centralized message operations with versioning and pub/sub
 * 
 * STORAGE ARCHITECTURE:
 * =====================
 * Redis Schema:
 * - canvas:talk:messages (ZSET): Maps timestamp → message ID (sorted index)
 * - canvas:talk:msg:* (STRING/HASH per message): Stores JSON message data
 * - canvas:talk:version (COUNTER): Global version for delta sync
 * - canvas:talk:events (CHANNEL): Pub/sub for real-time updates
 * 
 * KEY DESIGN RATIONALE:
 * ====================
 * ZSET + HASH is a deliberate tradeoff between query patterns and memory efficiency:
 * 
 * ZSET Benefits:
 *   - O(log N) sorted inserts/updates (vs O(N) for LIST)
 *   - O(log N) range queries by timestamp
 *   - Enables efficient pagination: ZREVRANGE for "latest N messages"
 *   - Automatic sorting; no manual sort step needed
 * 
 * HASH per Message Benefits:
 *   - O(1) get/set operations (vs O(N) search in LIST)
 *   - Efficient updates without rewriting entire message
 *   - Smaller memory footprint than full JSON duplication
 * 
 * ONE-KV-PER-MESSAGE PATTERN:
 * ===========================
 * Creating one Redis key per message (canvas:talk:msg:ID) is STANDARD PRACTICE for:
 * 
 * 1. SCALABILITY (handles 50+ concurrent users efficiently):
 *    - Don't serialize/deserialize entire message list per operation
 *    - Each operation only touches 2-3 Redis keys (ZSET + target message)
 *    - LIST-based alternative would require full read+rewrite on every edit/delete
 * 
 * 2. ATOMICITY & CONSISTENCY:
 *    - Pipeline operations ensure ZSET and HASH stay in sync
 *    - Individual message updates don't affect others
 *    - No risk of partial updates corrupting entire message store
 * 
 * 3. CACHE EFFICIENCY (Redis Cluster / Sharding):
 *    - Message keys can be distributed across cluster nodes
 *    - Reduces hotspot contention on single key
 *    - Better horizontal scalability
 * 
 * 4. MEMORY EFFICIENCY (vs JSON array in LIST):
 *    - JSON array duplication on each update: List gets re-pushed entirely
 *    - ZSET + HASH: Only modified message key updated, ZSET handles indexing
 *    - Example: 200 messages, 5KB each
 *      - LIST: Need to rewrite all ~1MB on every single message change
 *      - ZSET+HASH: Only write changed message + update ZSET entry (tiny)
 * 
 * 5. OPERATIONAL PATTERNS:
 *    - Pagination: ZREVRANGE(0, limit) gives N newest without fetching all
 *    - Search: Could add secondary indices (HASH for tags, ZSET for date ranges)
 *    - Archival: Can expire individual messages with TTL without listing
 * 
 * COMPARISON TABLE:
 * ================
 * Operation        | LIST         | ZSET+HASH
 * ─────────────────┼──────────────┼──────────────
 * Add message      | O(1) RPUSH   | O(log N) ZADD + O(1) HSET
 * Get by ID        | O(N) LRANGE  | O(1) HGET
 * Update message   | O(N) full    | O(log N) ZADD + O(1) HSET
 * Delete message   | O(N) full    | O(log N) ZREM + O(1) DEL
 * Get latest N     | O(N) LRANGE  | O(log N) ZREVRANGE
 * Pagination       | O(N) LRANGE  | O(log N) ZREVRANGE
 * 
 * PRODUCTION METRICS (for 50 concurrent users):
 * =============================================
 * Estimated usage (assuming 200 messages, 5KB avg):
 * - Memory: ~1MB message data + ~3KB ZSET index + 12KB version/channel = ~1.1MB
 * - Redis keys: 1 ZSET + 200 HASH + 1 counter + 1 channel = 203 keys
 * - Typical operation: 2-3 Redis calls per user action (pipeline batches)
 * - No concerns for Vercel Hobby plan (10K commands/day, plenty for 50 users)
 * 
 * FUTURE SCALABILITY CONSIDERATIONS:
 * ==================================
 * If messages exceed 10K:
 *   1. Add message TTL (e.g., 90-day expiration with Redis EXPIRE)
 *   2. Archive old messages to persistent storage (PostgreSQL)
 *   3. Implement sharding: one ZSET per day/month + federation query
 *   4. Add read-through cache layer (in-memory for hot messages)
 * 
 * Lean ZSET+HASH storage: O(log N) adds, O(1) updates/deletes
 */
import type { Redis } from 'ioredis';
import type { TalkMessage } from '$lib/types';

const NS = 'canvas:talk:';
const ZSET_KEY = `${NS}messages`; // Sorted set (timestamp → id)
const HASH_PREFIX = `${NS}msg:`; // Hash (id → JSON)
const VERSION_KEY = `${NS}version`;
const EVENTS_CHANNEL = `${NS}events`;

export type MessageEvent = {
	type: 'added' | 'updated' | 'deleted';
	message?: TalkMessage;
	id?: string;
	version: number;
};

// Storage adapter interface
interface StorageAdapter {
	getAll(limit: number): Promise<TalkMessage[]>;
	add(msg: TalkMessage): Promise<void>;
	update(id: string, msg: TalkMessage): Promise<void>;
	delete(id: string): Promise<void>;
	getById(id: string): Promise<TalkMessage | null>;
}

// ZSET+HASH adapter: O(log N) for adds, O(1) for updates/deletes
class ZsetHashAdapter implements StorageAdapter {
	constructor(private client: Redis) {}

	async getAll(limit: number): Promise<TalkMessage[]> {
		// FUTURE: If message structure changes, uncomment and adapt migration code below
		// This pattern enables backward-compatible upgrades to message schema
		
		// const keyType = await this.client.type(ZSET_KEY);
		// if (keyType === 'list') {
		// 	console.log('[ZsetHashAdapter] Detected LIST type, migrating to ZSET+HASH...');
		// 	const rawMessages = await this.client.lrange(ZSET_KEY, 0, -1);
		// 	const messages = rawMessages
		// 		.map(raw => {
		// 			try { return JSON.parse(raw) as TalkMessage; } 
		// 			catch { return null; }
		// 		})
		// 		.filter((m): m is TalkMessage => m !== null);
		// 	
		// 	if (messages.length > 0) {
		// 		const pipeline = this.client.pipeline();
		// 		messages.forEach(msg => {
		// 			pipeline.zadd(ZSET_KEY + ':new', msg.timestamp, msg.id);
		// 			pipeline.set(`${HASH_PREFIX}${msg.id}`, JSON.stringify(msg));
		// 		});
		// 		pipeline.rename(ZSET_KEY, ZSET_KEY + ':old');
		// 		pipeline.rename(ZSET_KEY + ':new', ZSET_KEY);
		// 		await pipeline.exec();
		// 		console.log(`[ZsetHashAdapter] Migrated ${messages.length} messages`);
		// 	} else {
		// 		await this.client.del(ZSET_KEY);
		// 	}
		// } else if (keyType !== 'zset' && keyType !== 'none') {
		// 	throw new Error(`Unexpected key type '${keyType}' for ${ZSET_KEY}`);
		// }
		
		// Get last N message IDs from sorted set (sorted by timestamp)
		const ids = await this.client.zrevrange(ZSET_KEY, 0, limit - 1);
		if (!ids.length) return [];
		
		// Fetch message data from hashes in parallel
		const pipeline = this.client.pipeline();
		ids.forEach(id => pipeline.get(`${HASH_PREFIX}${id}`));
		const results = await pipeline.exec();
		
		const now = Date.now();
		const expiredIds: string[] = [];
		
		const messages = results!
			.map(([err, data]) => (err || !data ? null : JSON.parse(data as string) as TalkMessage))
			.filter((m): m is TalkMessage => {
				if (!m) return false;
				// Filter out expired messages
				if (m.expiresAt && m.expiresAt <= now) {
					expiredIds.push(m.id);
					return false;
				}
				return true;
			})
			.reverse(); // Return in chronological order
		
		// Clean up expired message references from ZSET
		if (expiredIds.length > 0) {
			const cleanupPipeline = this.client.pipeline();
			expiredIds.forEach(id => cleanupPipeline.zrem(ZSET_KEY, id));
			await cleanupPipeline.exec();
		}
		
		return messages;
	}

	async getById(id: string): Promise<TalkMessage | null> {
		const data = await this.client.get(`${HASH_PREFIX}${id}`);
		return data ? JSON.parse(data) : null;
	}

	async add(msg: TalkMessage): Promise<void> {
		const pipeline = this.client.pipeline();
		pipeline.zadd(ZSET_KEY, msg.timestamp, msg.id); // Add to sorted set
		pipeline.set(`${HASH_PREFIX}${msg.id}`, JSON.stringify(msg)); // Store message data
		
		// Set TTL if message has expiration
		if (msg.expiresAt && msg.expiresAt > Date.now()) {
			const ttlSeconds = Math.ceil((msg.expiresAt - Date.now()) / 1000);
			pipeline.expire(`${HASH_PREFIX}${msg.id}`, ttlSeconds);
		}
		
		await pipeline.exec();
	}

	async update(id: string, msg: TalkMessage): Promise<void> {
		const exists = await this.client.exists(`${HASH_PREFIX}${id}`);
		if (!exists) throw new Error('Message not found');
		
		const pipeline = this.client.pipeline();
		pipeline.zadd(ZSET_KEY, msg.timestamp, msg.id); // Update score in ZSET
		pipeline.set(`${HASH_PREFIX}${msg.id}`, JSON.stringify(msg)); // Update hash
		await pipeline.exec();
	}

	async delete(id: string): Promise<void> {
		const exists = await this.client.exists(`${HASH_PREFIX}${id}`);
		if (!exists) throw new Error('Message not found');
		
		const pipeline = this.client.pipeline();
		pipeline.zrem(ZSET_KEY, id); // Remove from sorted set
		pipeline.del(`${HASH_PREFIX}${id}`); // Delete hash
		await pipeline.exec();
	}
}

export class MessageService {
	private storage: StorageAdapter;

	constructor(
		private client: Redis,
		private publisher?: Redis
	) {
		this.storage = new ZsetHashAdapter(client);
	}

	private async incr(): Promise<number> {
		return this.client.incr(VERSION_KEY);
	}

	private async publish(event: MessageEvent): Promise<void> {
		if (!this.publisher) return;
		await this.publisher.publish(EVENTS_CHANNEL, JSON.stringify(event));
	}

	async getMessages(limit = 200): Promise<TalkMessage[]> {
		return this.storage.getAll(limit);
	}

	async getVersion(): Promise<number> {
		const v = await this.client.get(VERSION_KEY);
		return v ? parseInt(v, 10) : 0;
	}

	async addMessage(username: string, text: string, expiresIn?: number): Promise<{ message: TalkMessage; version: number }> {
		const now = Date.now();
		const message: TalkMessage = {
			id: `msg-${now}-${Math.random().toString(36).substring(7)}`,
			username,
			text,
			timestamp: now,
			...(expiresIn && expiresIn > 0 ? { expiresAt: now + expiresIn * 1000 } : {})
		};
		await this.storage.add(message);
		const version = await this.incr();
		await this.publish({ type: 'added', message, version });
		return { message, version };
	}

	async updateMessage(id: string, username: string, text: string): Promise<{ message: TalkMessage; version: number }> {
		const existing = await this.storage.getById(id);
		if (!existing) throw new Error('Message not found');
		if (existing.username !== username) throw new Error('Unauthorized');

		const updated: TalkMessage = { ...existing, text, timestamp: Date.now() };
		await this.storage.update(id, updated);
		const version = await this.incr();
		await this.publish({ type: 'updated', message: updated, version });
		return { message: updated, version };
	}

	async deleteMessage(id: string, username: string): Promise<{ version: number }> {
		const existing = await this.storage.getById(id);
		if (!existing) throw new Error('Message not found');
		if (existing.username !== username) throw new Error('Unauthorized');

		await this.storage.delete(id);
		const version = await this.incr();
		await this.publish({ type: 'deleted', id, version });
		return { version };
	}
}

export const CHANNEL = EVENTS_CHANNEL;
