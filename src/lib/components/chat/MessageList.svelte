<!-- Context7: /sveltejs/svelte - Optimized message list with transitions -->
<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { talkMessages, formatDate, formatTime, shouldGroup, shouldShowDate, shouldShowTime } from './talkMessages.svelte';
	import { talkAuth } from './talkAuth.svelte';
	import { prefersReducedMotion } from './motion.svelte';

	interface Props {
		onHeaderVisibilityChange?: (visible: boolean) => void;
		onNearBottomChange?: (nearBottom: boolean) => void;
		scrollTrigger?: number;
	}

	const { onHeaderVisibilityChange, onNearBottomChange, scrollTrigger }: Props = $props();

	let messagesContainer: HTMLDivElement | undefined = $state();
	let messagesEnd: HTMLDivElement | undefined = $state();
	let lastScrollTop = $state(0);
	let headerVisible = $state(true);
	let scrollRAF = 0;

	// Context7: Derived transition params based on motion preference
	const transitionParams = $derived(
		prefersReducedMotion.current 
			? { duration: 150 } 
			: { y: 20, duration: 300, easing: quintOut }
	);

	// Context7: Derived - check if near bottom for scroll button
	let isNearBottom = $state(true);

	// $effect.pre for synchronous DOM updates before render
	$effect.pre(() => {
		if (!messagesEnd || !messagesContainer) return;
		talkMessages.messages.length; // Track dependency
		if (messagesContainer.offsetHeight + messagesContainer.scrollTop > messagesContainer.scrollHeight - 20) {
			messagesEnd.scrollIntoView({ behavior: 'auto' });
		}
	});

	// $effect cleanup with teardown function
	$effect(() => {
		return () => cancelAnimationFrame(scrollRAF);
	});

	// $effect for side effects, call parent callback
	$effect(() => {
		if (onHeaderVisibilityChange) {
			onHeaderVisibilityChange(headerVisible);
		}
	});

	// $effect for near bottom changes
	$effect(() => {
		if (onNearBottomChange) {
			onNearBottomChange(isNearBottom);
		}
	});

	function handleScroll() {
		cancelAnimationFrame(scrollRAF);
		scrollRAF = requestAnimationFrame(() => {
			if (!messagesContainer) return;
			const st = messagesContainer.scrollTop;
			headerVisible = st < lastScrollTop || st < 50;
			lastScrollTop = st;
			
			// Context7: Check if near bottom for scroll button
			const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
			isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
		});
	}

	// Context7: Expose scroll to bottom method
	function scrollToBottom() {
		messagesEnd?.scrollIntoView({ behavior: 'smooth' });
	}

	// Context7: Notify parent when scroll position changes
	$effect(() => {
		if (onNearBottomChange) {
			// Parent can show scroll button
		}
	});

	// Context7: Auto-scroll when user sends message (triggered by parent)
	$effect(() => {
		if (scrollTrigger && scrollTrigger > 0) {
			scrollToBottom();
		}
	});
</script>

<div class="messages-container" bind:this={messagesContainer} onscroll={handleScroll}>
	{#if !talkMessages.hasMessages}
		<div class="empty">
			<div class="empty-icon">💬</div>
			<p>No messages yet</p>
			<span>Start the conversation!</span>
		</div>
	{:else}
		{#each talkMessages.messages as msg, i (msg.id)}
			{#if shouldShowDate(talkMessages.messages, i)}
				<div class="date-sep"><span>{formatDate(msg.timestamp)}</span></div>
			{/if}
			<!-- Context7: Add transition based on motion preference -->
			<div 
				class="msg" 
				class:own={msg.username === talkAuth.username} 
				class:grouped={shouldGroup(talkMessages.messages, i)}
				in:fly={transitionParams}
			>
				{#if !shouldGroup(talkMessages.messages, i) && msg.username !== talkAuth.username}
					<div class="avatar">{msg.username.charAt(0).toUpperCase()}</div>
				{:else if msg.username !== talkAuth.username}
					<div class="avatar-spacer"></div>
				{/if}
				<div class="msg-content">
					{#if !shouldGroup(talkMessages.messages, i) && msg.username !== talkAuth.username}
						<span class="username">{msg.username}</span>
					{/if}
					<div class="msg-row">
						<div class="bubble" class:own={msg.username === talkAuth.username}>{msg.text}</div>
						{#if shouldShowTime(talkMessages.messages, i)}
							<span class="time">{formatTime(msg.timestamp)}</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	{/if}
	<div bind:this={messagesEnd}></div>
</div>

<!-- Context7: Scroll to bottom button - Phase 1 feature -->
{#if !isNearBottom}
	<button 
		class="scroll-to-bottom"
		onclick={scrollToBottom}
		transition:fly={{ y: 20, duration: 200 }}
		aria-label="Scroll to bottom"
		title="Scroll to bottom"
	>
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 5v14M19 12l-7 7-7-7"/>
		</svg>
	</button>
{/if}

<style>
	.messages-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: calc(52px + 1rem) 1rem 1rem;
		padding-bottom: 5rem;
		display: flex;
		flex-direction: column;
		gap: 2px;
		box-shadow: inset 0 8px 14px -12px rgba(0, 0, 0, 0.65);
		contain: size layout style paint;
		content-visibility: auto;
		contain-intrinsic-size: auto 400px;
		min-height: 0;
		-webkit-user-select: text;
		user-select: text;
	}

	.empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		contain: layout style;
	}

	.empty-icon {
		font-size: 4rem;
		opacity: 0.3;
		user-select: none;
		pointer-events: none;
	}

	.empty p {
		font: 500 1.1rem var(--font-ui);
		color: rgba(255, 255, 255, 0.9);
		margin: 0;
	}

	.empty span {
		font: 0.9rem var(--font-read);
		color: rgba(255, 255, 255, 0.5);
	}

	.date-sep {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
		contain: layout;
	}

	.date-sep span {
		font: 0.7rem var(--font-read);
		color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.08);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		user-select: none;
		pointer-events: none;
	}

	.msg {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
		animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
		will-change: transform, opacity;
		contain: layout style;
	}

	.msg.grouped {
		margin-top: 2px;
		animation: none;
	}

	.msg.own {
		flex-direction: row-reverse;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px) translateZ(0);
		}
		to {
			opacity: 1;
			transform: translateY(0) translateZ(0);
		}
	}

	.avatar {
		width: 28px;
		height: 28px;
		min-width: 28px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--accent, #0a84ff) 0%, var(--accent-dim, #0066cc) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font: 600 0.75rem var(--font-ui);
		color: var(--body-bg, #0a0a0a);
		flex-shrink: 0;
		text-transform: uppercase;
		user-select: none;
		contain: paint;
	}

	.avatar-spacer {
		width: 28px;
		min-width: 28px;
		flex-shrink: 0;
	}

	.msg-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: min(75%, 600px);
		contain: layout;
	}

	.msg.own .msg-content {
		align-items: flex-end;
	}

	.username {
		font: 500 0.75rem var(--font-read);
		color: rgba(255, 255, 255, 0.6);
		padding: 0 0.5rem 0.125rem;
		user-select: none;
	}

	.msg-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.msg.own .msg-row {
		flex-direction: row-reverse;
	}

	.bubble {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 18px;
		padding: 0.65rem 0.9rem;
		font: 0.95rem/1.4 var(--font-read);
		color: #fff;
		white-space: pre-wrap;
		word-wrap: break-word;
		transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: background-color;
		contain: layout;
	}

	.bubble:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.bubble.own {
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		border: none;
		box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
		text-shadow: 0 0.5px 0.5px rgba(0, 0, 0, 0.1);
	}

	.bubble.own:hover {
		background: linear-gradient(135deg, #0071f2 0%, #005bb5 100%);
		box-shadow: 0 2px 12px rgba(10, 132, 255, 0.4);
	}

	.time {
		font: 0.7rem var(--font-read);
		color: rgba(255, 255, 255, 0.4);
		white-space: nowrap;
		flex-shrink: 0;
		padding-bottom: 0.125rem;
		opacity: 0;
		transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: opacity;
		user-select: none;
		pointer-events: none;
	}

	.msg:hover .time {
		opacity: 1;
	}

	/* Scroll to bottom button */
	.scroll-to-bottom {
		position: fixed;
		bottom: calc(48px + 1.5rem + 1rem);
		right: 1.5rem;
		width: 32px;
		height: 32px;
		padding: 0;
		border-radius: 6px;
		background: rgba(0, 0, 0, 0.8);
		border: none;
		color: #fff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 20;
		will-change: background-color, color, transform;
	}

	.scroll-to-bottom:hover {
		background: linear-gradient(135deg, #0071f2 0%, #005bb5 100%);
		box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4);
	}

	.scroll-to-bottom:active {
		transform: scale(0.95) translateZ(0);
	}

	.scroll-to-bottom svg {
		width: 18px;
		height: 18px;
	}

	@media (max-width: 768px) {
		.msg-content {
			max-width: 80%;
		}

		.scroll-to-bottom {
			bottom: calc(48px + 1rem + 0.75rem);
			right: 1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		* {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
