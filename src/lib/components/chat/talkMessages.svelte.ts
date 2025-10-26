// Reactive message store with efficient operations
import type { TalkMessage } from '$lib/types';

// Use Map for O(1) lookups and efficient caching
const dateCache = new Map<number, string>();

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

// Message grouping utilities (pure functions)
export const shouldGroup = (messages: TalkMessage[], i: number) =>
	i > 0 && messages[i].username === messages[i - 1].username && messages[i].timestamp - messages[i - 1].timestamp < 60000;

export const shouldShowDate = (messages: TalkMessage[], i: number) =>
	i === 0 || new Date(messages[i].timestamp).toDateString() !== new Date(messages[i - 1].timestamp).toDateString();

export const shouldShowTime = (messages: TalkMessage[], i: number) =>
	i === messages.length - 1 || messages[i + 1].timestamp - messages[i].timestamp > 60000 || messages[i + 1].username !== messages[i].username;

class TalkMessages {
	// Context7: Use $state.raw for arrays when immutable updates preferred
	messages = $state<TalkMessage[]>([]);
	sending = $state(false);

	// Derived state (Context7: prefer $derived for computed values)
	get hasMessages() {
		return this.messages.length > 0;
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

	async send(text: string): Promise<boolean> {
		if (!text.trim()) return false;

		this.sending = true;
		try {
			const res = await fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'message', text: text.trim() })
			});
			if (!res.ok) return false;
			await this.fetch();
			return true;
		} catch (e) {
			console.error('Send error:', e);
			return false;
		} finally {
			this.sending = false;
		}
	}

	clear() {
		this.messages = [];
		dateCache.clear();
	}
}

export const talkMessages = new TalkMessages();
