<!--
Chat component - Ground-up rewrite for Svelte 5
Modular architecture: ChatAuth, ChatHeader, ChatMessages, ChatInput, ChatEditModal
-->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { MediaQuery } from 'svelte/reactivity';
	import { talkAuth } from './chat/talk-auth.svelte';
	import PocketBase from 'pocketbase';
	import { env } from '$env/dynamic/public';

	import { talkMessages } from './chat/talk-messages.svelte';
	import ChatAuth from './chat/ChatAuth.svelte';
	import ChatHeader from './chat/ChatHeader.svelte';
	import ChatMessages from './chat/ChatMessages.svelte';
	import ChatInput from './chat/ChatInput.svelte';
	import ChatEditModal from './chat/ChatEditModal.svelte';
	import type { TalkMessage } from '$lib/types';

	// Motion preferences
	const motionQuery = new MediaQuery('(prefers-reduced-motion: reduce)');
	const reducedMotion = $derived(motionQuery.current);
	const transitionDuration = $derived(reducedMotion ? 0 : 300);

	// UI state
	let isLive = $state(true);
	let headerVisible = $state(true);

	// Edit modal state
	let editModal = $state({ visible: false, id: null as string | null, text: '' });

	// Derived auth state
	const isLoading = $derived(talkAuth.checkingSession);
	const isAuthenticated = $derived(talkAuth.authenticated);

	// Session restoration on mount
	$effect(() => {
		(async () => {
			await talkAuth.restoreSession();
			if (talkAuth.authenticated) {
				talkMessages.setUsername(talkAuth.username);
				await talkMessages.fetch();
			}
		})();
	});

	// PB Realtime updates
	$effect(() => {
		if (!isLive || !isAuthenticated) return;
		
		console.log('[Talk] 🔄 Realtime started');
		const url = env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8080';
		const pb = new PocketBase(url);
		let liveTimeout: ReturnType<typeof setTimeout> | null = null;

		try {
			pb.collection('messages').subscribe('*', (e) => {
				talkMessages.handleRealtimeEvent(e.action, e.record);
			});
		} catch (e) {
			console.error('PB Subscribe error', e);
		}

		// 5-minute timeout for live mode
		liveTimeout = setTimeout(() => {
			console.log('[Talk] ⏱️ Live mode timed out');
			pb.collection('messages').unsubscribe('*');
			isLive = false;
		}, 5 * 60 * 1000);

		return () => {
			pb.collection('messages').unsubscribe('*');
			if (liveTimeout) clearTimeout(liveTimeout);
			console.log('[Talk] ⏹️ Live updates stopped');
		};
	});

	function openEditModal(msg: TalkMessage) {
		editModal = { visible: true, id: msg.id, text: msg.text };
	}

	function closeEditModal() {
		editModal = { visible: false, id: null, text: '' };
	}
</script>

<div class="chat-wrapper">
	{#if isLoading}
		<div class="session-loader" in:fade={{ duration: transitionDuration }}>
			<div class="spinner">
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.2" />
					<path d="M12 3c4.97 0 9 4.03 9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
			</div>
			<p>Checking session...</p>
		</div>
	{:else if !isAuthenticated}
		<ChatAuth {transitionDuration} {reducedMotion} />
	{:else}
		<div class="chat-container">
			<ChatHeader visible={headerVisible} bind:isLive />
			<ChatMessages {reducedMotion} onEditRequest={openEditModal} bind:headerVisible />
			<ChatInput onSent={() => {}} />
		</div>
		<ChatEditModal 
			bind:visible={editModal.visible}
			messageId={editModal.id}
			initialText={editModal.text}
			onClose={closeEditModal}
			{reducedMotion}
		/>
	{/if}
</div>

<style>
	.chat-wrapper {
		display: flex;
		width: 100%;
		height: 100%;
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
		-webkit-text-size-adjust: 100%;
		flex-direction: column;
		position: relative;
		background: #0a0a0a;
	}

	@media (max-width: 768px) {
		.chat-wrapper {
			margin: 0 auto;
			max-width: 600px;
		}
	}

	.chat-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	.session-loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		width: 100%;
		height: 100%;
		min-height: 200px;
	}

	.spinner {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
	}

	.spinner svg {
		animation: spin 1.5s linear infinite;
		color: rgba(255, 255, 255, 0.6);
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.session-loader p {
		font: 0.9rem var(--font-read);
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		letter-spacing: 0.02em;
	}
</style>
