// Reactive message store with efficient operations
import type { TalkMessage } from '$lib/types';

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
				if (lastTs) {
					// Append only new messages (server returns items after 'since')
					const existing = new Set(messages.map(m => m.id));
					const toAppend = serverMessages.filter(m => !existing.has(m.id));
					if (toAppend.length) messages = [...messages, ...toAppend];
				} else {
					// Initial load: replace
					messages = serverMessages;
				}
			}
		} catch (e) {
			console.error('Fetch error:', e);
		}
	};

	const send = async (text: string, username: string): Promise<boolean> => {
		if (!text.trim()) return false;

		// Context7: Optimistic UI
		const tempId = `temp-${Date.now()}`;
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
			const res = await globalThis.fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'message', text: text.trim() })
			});
			
			if (!res.ok) {
				// Context7: Mark as failed, keep in UI for retry
				messages = messages.map(m => 
					m.id === tempId ? { ...m, status: 'failed' as const } : m
				);
				return false;
			}
			
			// Get the server response to extract the actual message
			const serverMessage: TalkMessage = await res.json();
			
			// Context7: Replace optimistic message with server response
			messages = messages.map(m => 
				m.id === tempId ? serverMessage : m
			);
			
			return true;
		} catch (e) {
			console.error('Send error:', e);
			// Context7: Mark as failed on exception
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
			
			// Context7: Get server response to sync state
			const updatedMessage: TalkMessage = await res.json();
			messages = messages.map(m =>
				m.id === messageId ? updatedMessage : m
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
				// Context7: Restore message on failure
				if (messageToDelete) {
					messages = [...messages, messageToDelete];
				}
				return false;
			}
			return true;
		} catch (e) {
			console.error('Delete error:', e);
			// Context7: Restore message on error
			if (messageToDelete) {
				messages = [...messages, messageToDelete];
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

	// Context7: Return public API
	return {
		get messages() { return messages; },
		set messages(value) { messages = value; },
		get sending() { return sending; },
		set sending(value) { sending = value; },
		get editing() { return editing; },
		set editing(value) { editing = value; },
		get deleting() { return deleting; },
		set deleting(value) { deleting = value; },
		get lastReadTimestamp() { return lastReadTimestamp; },
		set lastReadTimestamp(value) { lastReadTimestamp = value; },
		get currentUsername() { return currentUsername; },
		set currentUsername(value) { currentUsername = value; },
		get hasMessages() { return hasMessages; },
		get unreadCount() { return unreadCount; },
		markAsRead,
		setUsername,
		fetch: fetchMessages,
		send,
		edit,
		delete: deleteMsg,
		clear
	};
}

export const talkMessages = createTalkMessages();
