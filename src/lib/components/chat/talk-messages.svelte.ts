// Reactive message store with efficient operations
import type { TalkMessage } from '$lib/types';

// Context7: Export type for full TypeScript inference in consuming components
export type TalkMessagesStore = ReturnType<typeof createTalkMessages>;

// Use Map for O(1) lookups and efficient caching
const dateCache = new Map<number, string>();
// Cache date strings to avoid repeated Date object allocation
const dateStringCache = new Map<number, string>();

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
	dateCache.set(ts, result);
	return result;
};

// Optimized: Cache toDateString to avoid repeated Date allocations
const getDateString = (ts: number): string => {
	if (dateStringCache.has(ts)) return dateStringCache.get(ts)!;
	const dateStr = new Date(ts).toDateString();
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
	
	// Context7: Track last read timestamp for unread count (initialize to 0 so initial messages aren't marked as unread)
	let lastReadTimestamp = $state(0);
	let currentUsername = $state(''); // Track current user to exclude own messages from unread count
	
	// Track deleted message IDs to prevent them from reappearing during polling
	const deletedIds = new Set<string>();

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

	const fetchMessages = async () => {
		try {
			// Fetch incrementally: request only the last N messages or those since last timestamp
			const lastTs = messages.length ? messages[messages.length - 1].timestamp : undefined;
			const params: string[] = [];
			params.push('limit=200');
			if (lastTs) params.push(`since=${lastTs}`);

			const res = await globalThis.fetch(`/api/talk${params.length ? `?${params.join('&')}` : ''}`, {
				credentials: 'include'
			});
			if (res.ok) {
				const serverMessages: TalkMessage[] = await res.json();
				// Ensure all fetched messages have status: 'sent' (they're already confirmed on server)
				const messagesToAdd = serverMessages.map(m => ({
					...m,
					status: 'sent' as const
				}));
				
				if (lastTs) {
					// Append only new messages (server returns items after 'since')
					// Filter out any messages that have been deleted
					const existing = new Set(messages.map(m => m.id));
					const toAppend = messagesToAdd.filter(m => 
						!existing.has(m.id) && !deletedIds.has(m.id)
					);
					if (toAppend.length) messages = [...messages, ...toAppend];
				} else {
					// Initial load: replace - still filter out deleted IDs (shouldn't happen, but be safe)
					messages = messagesToAdd.filter(m => !deletedIds.has(m.id));
				}
			}
		} catch (e) {
			console.error('Fetch error:', e);
		}
	};

	const send = async (text: string, username: string): Promise<boolean> => {
		if (!text.trim()) return false;

		// Context7: Optimistic UI
		const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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
			
			// Get the server response to extract the actual message
			const serverMessage: TalkMessage = await res.json();
			
			// Context7: Replace optimistic message with server response, mark as sent
			messages = messages.map(m => 
				m.id === tempId ? { ...serverMessage, status: 'sent' as const } : m
			);
			
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
			
			// Context7: Get server response to sync state, mark as sent
			const updatedMessage: TalkMessage = await res.json();
			messages = messages.map(m =>
				m.id === messageId ? { ...updatedMessage, status: 'sent' as const } : m
			);
			
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
