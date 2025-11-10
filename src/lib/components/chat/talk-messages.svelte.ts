// Reactive message store with efficient operations
import type { TalkMessage } from '$lib/types';

// Context7: Export type for full TypeScript inference in consuming components
export type TalkMessagesStore = ReturnType<typeof createTalkMessages>;

// Use Map for O(1) lookups with size limits to prevent memory leaks
const MAX_CACHE_SIZE = 200;
const dateCache = new Map<number, string>();
const dateStringCache = new Map<number, string>();

// LRU cache helper: remove oldest entry when limit reached
function limitCacheSize(cache: Map<any, any>, maxSize: number) {
	if (cache.size > maxSize) {
		const firstKey = cache.keys().next().value;
		cache.delete(firstKey);
	}
}

// Pure utility functions (not reactive)
export const formatTime = (ts: number) => {
	const d = new Date(ts);
	const h = d.getHours() % 12 || 12;
	const m = d.getMinutes().toString().padStart(2, '0');
	return `${h}:${m} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
};

export const formatDate = (ts: number) => {
	if (dateCache.has(ts)) return dateCache.get(ts)!;
	const d = new Date(ts);
	const today = new Date().toDateString();
	const yesterday = new Date(Date.now() - 864e5).toDateString();
	const ds = d.toDateString();
	const result =
		ds === today ? 'Today' : ds === yesterday ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	limitCacheSize(dateCache, MAX_CACHE_SIZE);
	dateCache.set(ts, result);
	return result;
};

// Optimized: Cache toDateString to avoid repeated Date allocations
const getDateString = (ts: number): string => {
	if (dateStringCache.has(ts)) return dateStringCache.get(ts)!;
	const dateStr = new Date(ts).toDateString();
	limitCacheSize(dateStringCache, MAX_CACHE_SIZE);
	dateStringCache.set(ts, dateStr);
	return dateStr;
};

// Message grouping utilities (pure functions)
export const shouldGroup = (messages: TalkMessage[], i: number) =>
	i > 0 && messages[i].username === messages[i - 1].username && messages[i].timestamp - messages[i - 1].timestamp < 60000;

export const shouldShowDate = (messages: TalkMessage[], i: number) =>
	i === 0 || getDateString(messages[i].timestamp) !== getDateString(messages[i - 1].timestamp);

export const shouldShowTime = (messages: TalkMessage[], i: number) =>
	i === messages.length - 1 || messages[i + 1].timestamp - messages[i].timestamp > 60000 || messages[i + 1].username !== messages[i].username;

// Context7: Factory function for creating reactive message store (recommended over class pattern in Svelte 5)
function createTalkMessages() {
	// Context7: Use $state.raw for immutable array updates
	let messages = $state.raw<TalkMessage[]>([]);
	let sending = $state(false);
	let editing = $state(false);
	let deleting = $state(false);
	
	// Versioning for delta sync
	let lastSeenVersion = $state(0);
	
	// Context7: Track last read timestamp for unread count (initialize to 0 so initial messages aren't marked as unread)
	let lastReadTimestamp = $state(0);
	let currentUsername = $state(''); // Track current user to exclude own messages from unread count
	
	// Track deleted message IDs to prevent them from reappearing during polling
	const deletedIds = new Set<string>();
	
	// Counter for guaranteed unique temp IDs
	let tempIdCounter = 0;
	
	// Map temp IDs to server IDs to prevent duplicates during SSE updates
	const tempToServerIdMap = new Map<string, string>();

	// Context7: Use $derived for computed values
	const hasMessages = $derived(messages.length > 0);
	
	// Context7: Unread message count - only count messages from others
	const unreadCount = $derived.by(() =>
		messages.filter(m => 
			m.timestamp > lastReadTimestamp && 
			m.username !== currentUsername
		).length
	);

	const markAsRead = () => {
		if (messages.length > 0) {
			lastReadTimestamp = messages[messages.length - 1].timestamp;
		}
	};
	
	const setUsername = (username: string) => {
		currentUsername = username;
	};

	// Apply delta: MERGE incoming with existing (never lose old messages!)
	const applyDelta = (delta: { version: number; messages: TalkMessage[] }) => {
		const { version, messages: serverMessages } = delta;
		
		// Mark all server messages as sent
		const incoming = serverMessages.map(m => ({ ...m, status: 'sent' as const }));
		const incomingIds = new Set(incoming.map(m => m.id));
		
		// Keep only pending/failed optimistic messages that haven't been confirmed
		const pending = messages.filter(m => {
			if (!m.id.startsWith('temp-')) return false;
			if (m.status !== 'pending' && m.status !== 'failed') return false;
			// Don't keep if already mapped to server message
			const serverId = tempToServerIdMap.get(m.id);
			return !serverId || !incomingIds.has(serverId);
		});
		
		// Merge: incoming (server truth) + pending (optimistic)
		// CRITICAL: Use server as source of truth for deletions
		// Incoming contains what server has, pending contains what we're optimistically sending
		const merged = [
			...incoming,
			...pending.filter(m => {
				const serverId = tempToServerIdMap.get(m.id);
				return !serverId || !incomingIds.has(serverId);
			})
		].sort((a, b) => a.timestamp - b.timestamp);
		
		// Deduplicate by ID (keep first occurrence)
		const seen = new Set<string>();
		messages = merged.filter(m => {
			if (seen.has(m.id)) return false;
			seen.add(m.id);
			return true;
		});
		
		// Clean up temp mappings for messages that are now confirmed
		for (const [tempId, serverId] of tempToServerIdMap.entries()) {
			if (!messages.find(m => m.id === tempId)) {
				tempToServerIdMap.delete(tempId);
			}
		}
		
		lastSeenVersion = version;
	};
	
	let fetchCount = 0; // Track fetch calls for periodic full refresh
	
	const fetchMessages = async () => {
		try {
			const res = await globalThis.fetch('/api/talk?limit=200', {
				credentials: 'include'
			});
			if (res.ok) {
				const data = await res.json();
				applyDelta(data);
			}
		} catch (e) {
			console.error('Fetch error:', e);
		}
	};

	const send = async (text: string, username: string): Promise<boolean> => {
		if (!text.trim()) return false;

		// Context7: Optimistic UI with guaranteed unique temp ID
		const tempId = `temp-${Date.now()}-${++tempIdCounter}`;
		const tempTimestamp = Date.now();
		const optimisticMsg: TalkMessage = {
			id: tempId,
			username: username,
			text: text.trim(),
			timestamp: tempTimestamp,
			status: 'pending'
		};
		
		messages = [...messages, optimisticMsg];
		sending = true;
		
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
			
			const res = await globalThis.fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'message', text: text.trim() }),
				signal: controller.signal
			});
			
			clearTimeout(timeoutId);
			
			if (!res.ok) {
				// Context7: Mark as failed, keep in UI for retry
				messages = messages.map(m => 
					m.id === tempId ? { ...m, status: 'failed' as const } : m
				);
				return false;
			}
			
			// Get the server response with version
			const data = await res.json();
			const { version, ...serverMessage } = data;
			
			// Map temp ID to server ID for deduplication
			tempToServerIdMap.set(tempId, serverMessage.id);
			
			// Context7: Add minimum delay to ensure pending state is visible
			await new Promise(resolve => setTimeout(resolve, 150));
			
			// Context7: Replace optimistic message with server response, mark as sent
			messages = messages.map(m => 
				m.id === tempId ? { ...serverMessage, status: 'sent' as const } : m
			);
			
			if (version) lastSeenVersion = version;
			return true;
		} catch (e) {
			console.error('Send error:', e);
			// Context7: Mark as failed on exception (timeout, network error, etc)
			messages = messages.map(m => 
				m.id === tempId ? { ...m, status: 'failed' as const } : m
			);
			return false;
		} finally {
			sending = false;
		}
	};

	const edit = async (messageId: string, newText: string): Promise<boolean> => {
		if (!newText.trim()) return false;

		// Context7: Store original for rollback on failure
		const originalMessage = messages.find(m => m.id === messageId);
		if (!originalMessage) return false;

		// Context7: Optimistic update
		messages = messages.map(m =>
			m.id === messageId ? { ...m, text: newText.trim(), status: 'pending' as const } : m
		);

		editing = true;
		try {
			const res = await globalThis.fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'edit', messageId, text: newText.trim() })
			});
			if (!res.ok) {
				const error = await res.json();
				console.error('Edit error:', error);
				// Context7: Rollback on failure
				messages = messages.map(m =>
					m.id === messageId ? originalMessage : m
				);
				return false;
			}
			
			// Context7: Get server response with version
			const data = await res.json();
			const { version, ...updatedMessage } = data;
			messages = messages.map(m =>
				m.id === messageId ? { ...updatedMessage, status: 'sent' as const } : m
			);
			
			if (version) lastSeenVersion = version;
			return true;
		} catch (e) {
			console.error('Edit error:', e);
			// Context7: Rollback on error
			messages = messages.map(m =>
				m.id === messageId ? originalMessage : m
			);
			return false;
		} finally {
			editing = false;
		}
	};

	const deleteMsg = async (messageId: string): Promise<boolean> => {
		deleting = true;
		
		// Context7: Optimistic update - remove from UI immediately
		const messageToDelete = messages.find(m => m.id === messageId);
		messages = messages.filter(m => m.id !== messageId);
		
		// Track deletion to prevent re-adding during polling
		deletedIds.add(messageId);
		
		try {
			const res = await globalThis.fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'delete', messageId })
			});
			if (!res.ok) {
				const error = await res.json();
				console.error('Delete error:', error);
				// Context7: Restore message on failure and remove from deleted tracking
				if (messageToDelete) {
					messages = [...messages, messageToDelete];
					deletedIds.delete(messageId);
				}
				return false;
			}
			
			const data = await res.json();
			if (data.version) lastSeenVersion = data.version;
			return true;
		} catch (e) {
			console.error('Delete error:', e);
			// Context7: Restore message on error and remove from deleted tracking
			if (messageToDelete) {
				messages = [...messages, messageToDelete];
				deletedIds.delete(messageId);
			}
			return false;
		} finally {
			deleting = false;
		}
	};

	const clear = () => {
		messages = [];
		dateCache.clear();
		dateStringCache.clear();
		deletedIds.clear();
		tempToServerIdMap.clear();
	};

	const retry = async (failedMessageId: string, username: string): Promise<boolean> => {
		const failedMsg = messages.find(m => m.id === failedMessageId);
		if (!failedMsg || failedMsg.status !== 'failed' || !failedMsg.text) return false;
		
		// Remove the failed message from the UI
		messages = messages.filter(m => m.id !== failedMessageId);
		
		// Resend the message
		return await send(failedMsg.text, username);
	};

	// Context7: Return public API - wrap state in getters to preserve reactivity
	// This prevents "state_referenced_locally" warnings when accessing from components
	return {
		get messages() { return messages; },
		get sending() { return sending; },
		get editing() { return editing; },
		get deleting() { return deleting; },
		get hasMessages() { return hasMessages; },
		get unreadCount() { return unreadCount; },
		markAsRead,
		setUsername,
		fetch: fetchMessages,
		send,
		edit,
		delete: deleteMsg,
		retry,
		clear
	} as const;
}

export const talkMessages = createTalkMessages();
