<!-- /sveltejs/svelte/svelte@5.37.0 - Composition-based chat component -->
<script lang="ts">
	import type { TalkMessage } from '$lib/types';
	import AuthCard from './chat/auth-card.svelte';
	import ChatHeader from './chat/chat-header.svelte';
	import InputBar from './chat/input-bar.svelte';
	import MessageList from './chat/message-list.svelte';
	import SessionLoader from './chat/session-loader.svelte';
	import { talkAuth } from './chat/talk-auth.svelte';
	import { talkMessages } from './chat/talk-messages.svelte';

	interface Props {
		initialUsername?: string;
		initialMessages?: TalkMessage[];
	}

	// Use $props() rune to receive component props
	const { initialUsername = '', initialMessages = [] }: Props = $props();

	// Local UI state with $state rune
	let headerVisible = $state(true);
	let scrollTrigger = $state(0);
	let pollInterval: NodeJS.Timeout | null = null;
	let isLive = $state(false);
	let liveTimer: NodeJS.Timeout | null = null;
	let lastActivity = $state(Date.now());

	// Polling control functions
	function startPolling() {
		if (pollInterval) return; // Already polling
		
		console.log(`[Talk] 🔄 Polling started at ${new Date().toLocaleTimeString()}`);
		pollInterval = setInterval(async () => {
			await talkMessages.fetch();
		}, 2000);
	}

	function stopPolling() {
		if (pollInterval) {
			console.log(`[Talk] ⏹️  Polling stopped at ${new Date().toLocaleTimeString()}`);
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	// Context7: Separate effect for live timer management (reactive to isLive changes)
	$effect(() => {
		if (!isLive) {
			if (liveTimer) {
				clearTimeout(liveTimer);
				liveTimer = null;
			}
			return;
		}

		// Reset timer whenever activity occurs or isLive changes
		lastActivity = Date.now();

		// Use tick() to ensure state is updated before setting timeout
		const timer = setTimeout(() => {
			console.log(`[Talk] ⏱️  Live mode timed out after 5 minutes`);
			isLive = false;
			stopPolling();
		}, 5 * 60 * 1000);

		liveTimer = timer;

		return () => {
			if (timer) clearTimeout(timer);
		};
	});

	function toggleLive() {
		isLive = !isLive;
	}

	// Activity tracking
	function onUserActivity() {
		lastActivity = Date.now();
		// Timer will automatically reset via the isLive effect
	}

	// Initialize on mount with $effect
	$effect(() => {
		// Restore session on component mount (runs only once)
		(async () => {
			const restored = await talkAuth.restoreSession();
			if (restored) {
				// Context7: Set username for unread filtering
				talkMessages.setUsername(talkAuth.username);
				await talkMessages.fetch();
				// Context7: Mark initial messages as read
				talkMessages.markAsRead();
			}
		})();
		
		// Cleanup on unmount
		return () => {
			stopPolling();
			if (liveTimer) {
				clearTimeout(liveTimer);
			}
		};
	});

	// Separate effect for polling management (reactive to isLive changes)
	$effect(() => {
		if (isLive) {
			startPolling();
		} else {
			stopPolling();
		}
	});

	// Derived state with $derived rune
	const isLoading = $derived(talkAuth.checkingSession);
	const isAuthenticated = $derived(talkAuth.authenticated);

	// Handlers for child components
	function handleHeaderVisibilityChange(visible: boolean) {
		headerVisible = visible;
	}

	function handleMessageSent() {
		// Trigger scroll after sending message
		scrollTrigger = Date.now();
		onUserActivity();
	}

	function handleToggleLive() {
		toggleLive();
	}
</script>

<!-- Conditional rendering based on auth state -->
<div class="chat-wrapper">
	{#if isLoading}
		<SessionLoader />
	{:else if !isAuthenticated}
		<AuthCard />
	{:else}
		<div class="chat-container">
			<ChatHeader visible={headerVisible} isLive={isLive} onToggleLive={handleToggleLive} />
			<MessageList 
				onHeaderVisibilityChange={handleHeaderVisibilityChange}
				scrollTrigger={scrollTrigger}
			/>
			<InputBar onMessageSent={handleMessageSent} onActivity={onUserActivity} />
		</div>
	{/if}
</div>

<style>
	/* Container styles with modern CSS features */
	.chat-wrapper {
		display: flex;
		width: 100%;
		height: 100%;
		background: var(--body-bg, #0a0a0a);
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
		-webkit-text-size-adjust: 100%;
		contain: layout style;
	}

	.chat-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		position: relative;
		contain: layout;
		overflow: hidden;
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
