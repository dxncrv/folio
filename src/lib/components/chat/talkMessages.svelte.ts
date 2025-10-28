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

class TalkMessages {
	// Context7: Use $state.raw for arrays when immutable updates preferred
	messages = $state<TalkMessage[]>([]);
	sending = $state(false);
	editing = $state(false);
	deleting = $state(false);
	
	// Context7: Track last read timestamp for unread count (initialize to 0 so initial messages aren't marked as unread)
	lastReadTimestamp = $state(0);
	currentUsername = $state(''); // Track current user to exclude own messages from unread count

	// Derived state (Context7: prefer $derived for computed values)
	get hasMessages() {
		return this.messages.length > 0;
	}
	
	// Context7: Unread message count (Phase 2, Item 8) - only count messages from others
	get unreadCount() {
		return this.messages.filter(m => 
			m.timestamp > this.lastReadTimestamp && 
			m.username !== this.currentUsername
		).length;
	}
	
	// Context7: Mark messages as read
	markAsRead() {
		if (this.messages.length > 0) {
			this.lastReadTimestamp = this.messages[this.messages.length - 1].timestamp;
		}
	}
	
	// Context7: Set current username for unread filtering
	setUsername(username: string) {
		this.currentUsername = username;
	}

	async fetch() {
		try {
			const res = await fetch('/api/talk');
			if (res.ok) {
				this.messages = await res.json();
			}
		} catch (e) {
			console.error('Fetch error:', e);
		}
	}

	async send(text: string, username: string): Promise<boolean> {
		if (!text.trim()) return false;

		// Context7: Optimistic UI (Phase 2, Item 6)
		const tempId = `temp-${Date.now()}`;
		const tempTimestamp = Date.now();
		const optimisticMsg: TalkMessage = {
			id: tempId,
			username: username,
			text: text.trim(),
			timestamp: tempTimestamp,
			status: 'pending'
		};
		
		this.messages = [...this.messages, optimisticMsg];
		this.sending = true;
		
		try {
			const res = await fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'message', text: text.trim() })
			});
			
			if (!res.ok) {
				// Context7: Mark as failed, keep in UI for retry
				this.messages = this.messages.map(m => 
					m.id === tempId ? { ...m, status: 'failed' as const } : m
				);
				return false;
			}
			
			// Context7: Show 'sent' status briefly
			this.messages = this.messages.map(m => 
				m.id === tempId ? { ...m, status: 'sent' as const } : m
			);
			
			// Context7: Wait to show checkmark, then smoothly replace with server data
			await new Promise(resolve => setTimeout(resolve, 150));
			
			// Context7: Fetch and replace temp message with real one
			const res2 = await fetch('/api/talk');
			if (res2.ok) {
				const serverMessages: TalkMessage[] = await res2.json();
				
				// Find the matching server message (same text, username, and close timestamp)
				const matchingMsg = serverMessages.find(m => 
					m.text === optimisticMsg.text && 
					m.username === optimisticMsg.username &&
					Math.abs(m.timestamp - tempTimestamp) < 5000 // Within 5 seconds
				);
				
				if (matchingMsg) {
					// Replace temp message with server message but keep the temp ID to prevent flash
					this.messages = this.messages.map(m => 
						m.id === tempId ? { ...matchingMsg, id: tempId } : m
					);
					// Then after a brief moment, update to use all server messages with real IDs
					setTimeout(() => {
						this.messages = serverMessages;
					}, 100);
				} else {
					// Fallback: just use server messages
					this.messages = serverMessages;
				}
			}
			
			return true;
		} catch (e) {
			console.error('Send error:', e);
			// Context7: Mark as failed on exception
			this.messages = this.messages.map(m => 
				m.id === tempId ? { ...m, status: 'failed' as const } : m
			);
			return false;
		} finally {
			this.sending = false;
		}
	}

	async edit(messageId: string, newText: string): Promise<boolean> {
		if (!newText.trim()) return false;

		this.editing = true;
		try {
			const res = await fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'edit', messageId, text: newText.trim() })
			});
			if (!res.ok) {
				const error = await res.json();
				console.error('Edit error:', error);
				return false;
			}
			await this.fetch();
			return true;
		} catch (e) {
			console.error('Edit error:', e);
			return false;
		} finally {
			this.editing = false;
		}
	}

	async delete(messageId: string): Promise<boolean> {
		this.deleting = true;
		try {
			const res = await fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'delete', messageId })
			});
			if (!res.ok) {
				const error = await res.json();
				console.error('Delete error:', error);
				return false;
			}
			await this.fetch();
			return true;
		} catch (e) {
			console.error('Delete error:', e);
			return false;
		} finally {
			this.deleting = false;
		}
	}

	clear() {
		this.messages = [];
		dateCache.clear();
	}
}

export const talkMessages = new TalkMessages();
