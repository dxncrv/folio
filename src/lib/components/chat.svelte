<!-- Optimized composition-based chat component (Svelte 5) -->
<script lang="ts">
	import AuthCard from './chat/auth-card.svelte';
	import ChatHeader from './chat/chat-header.svelte';
	import InputBar from './chat/input-bar.svelte';
	import MessageList from './chat/message-list.svelte';
	import SessionLoader from './chat/session-loader.svelte';
	import { talkAuth } from './chat/talk-auth.svelte';
	import { talkMessages } from './chat/talk-messages.svelte';

	// Consolidated UI state
	let headerVisible = $state(true);
	let scrollTrigger = $state(0);
	let isLive = $state(true); // Start polling on page load
	let inputBar = $state<any>(null); // Component reference

	// Derived computed values
	const isLoading = $derived(talkAuth.checkingSession);
	const isAuthenticated = $derived(talkAuth.authenticated);

	// Session restoration - one-time async initialization
	$effect.pre(() => {
		(async () => {
			const restored = await talkAuth.restoreSession();
			if (restored) {
				talkMessages.setUsername(talkAuth.username);
				await talkMessages.fetch();
				talkMessages.markAsRead();
			}
		})();
	});

	// Polling lifecycle with implicit cleanup
	$effect(() => {
		if (!isLive) return;

		console.log(`[Talk] 🔄 Polling started`);
		const poll = setInterval(() => talkMessages.fetch(), 2000);

		// Auto-disable live mode after 5 minutes
		const timeout = setTimeout(() => {
			console.log(`[Talk] ⏱️  Live mode timed out`);
			isLive = false;
		}, 5 * 60 * 1000);

		return () => {
			clearInterval(poll);
			clearTimeout(timeout);
			console.log(`[Talk] ⏹️  Polling stopped`);
		};
	});


	// Handlers for child components (inline for minimal logic)
	function handleMessageSent() {
		scrollTrigger = Date.now();
		// Activity is tracked automatically in message sending
	}

	function restoreInputFocus() {
		// Restore focus to input field after delete/action
		if (inputBar?.getTextarea?.()) {
			setTimeout(() => inputBar.getTextarea()?.focus(), 0);
		}
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
			<ChatHeader 
				visible={headerVisible} 
				isLive={isLive} 
				onToggleLive={() => isLive = !isLive}
			/>
			<MessageList 
				onHeaderVisibilityChange={(visible) => headerVisible = visible}
				scrollTrigger={scrollTrigger}
				onActionComplete={restoreInputFocus}
			/>
			<InputBar 
				bind:this={inputBar}
				onMessageSent={handleMessageSent}
			/>
		</div>
	{/if}
</div>

<style>
	/* Container styles with modern CSS features */
	.chat-wrapper {
		display: flex;
		width: 100%;
		height: 100%;
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
