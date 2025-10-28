<!-- /sveltejs/svelte/svelte@5.37.0 - Composition-based chat component -->
<script lang="ts">
	import type { TalkMessage } from '$lib/types';
	import AuthCard from './chat/AuthCard.svelte';
	import ChatHeader from './chat/ChatHeader.svelte';
	import InputBar from './chat/InputBar.svelte';
	import MessageList from './chat/MessageList.svelte';
	import SessionLoader from './chat/SessionLoader.svelte';
	import { talkAuth } from './chat/talkAuth.svelte';
	import { talkMessages } from './chat/talkMessages.svelte';

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

	// Initialize on mount with $effect
	$effect(() => {
		// Restore session on component mount
		(async () => {
			const restored = await talkAuth.restoreSession();
			if (restored) {
				// Context7: Set username for unread filtering
				talkMessages.setUsername(talkAuth.username);
				await talkMessages.fetch();
				// Context7: Mark initial messages as read
				talkMessages.markAsRead();
				
				// Context7: Start polling for new messages every 2 seconds
				pollInterval = setInterval(async () => {
					await talkMessages.fetch();
				}, 2000);
			}
		})();
		
		// Cleanup polling on unmount
		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
		};
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
			<ChatHeader visible={headerVisible} />
			<MessageList 
				onHeaderVisibilityChange={handleHeaderVisibilityChange}
				scrollTrigger={scrollTrigger}
			/>
			<InputBar onMessageSent={handleMessageSent} />
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
