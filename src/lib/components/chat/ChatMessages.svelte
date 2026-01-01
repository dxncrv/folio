<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { talkAuth } from './talk-auth.svelte';
	import { talkMessages, formatDate, formatTime, shouldGroup, shouldShowDate, shouldShowTime } from './talk-messages.svelte';
	import type { TalkMessage } from '$lib/types';

	interface Props {
		reducedMotion?: boolean;
		headerVisible?: boolean;
		onEditRequest?: (msg: TalkMessage) => void;
	}
	let { reducedMotion = false, headerVisible = $bindable(true), onEditRequest }: Props = $props();

	const flyParams = $derived(reducedMotion ? { duration: 0 } : { y: 20, duration: 300, easing: quintOut });
	const transitionDuration = $derived(reducedMotion ? 0 : 300);
	const SWIPE_THRESHOLD = 80;

	// Refs
	let container: HTMLDivElement | undefined = $state();
	let endMarker: HTMLDivElement | undefined = $state();

	// Scroll state
	let nearBottom = $state(true);
	let prevScrollTop = $state(0);
	let scrollRAF = 0;
	let didInitialScroll = $state(false);

	// Swipe gesture
	let swipe = $state({ id: null as string | null, shift: 0, dragging: false, startX: 0 });

	// Countdown ticker for disappearing messages
	let tick = $state(0);
	let lastCleanup = 0;

	// Effects
	$effect(() => {
		const interval = setInterval(() => {
			tick++;
			const now = Date.now();
			if (now - lastCleanup > 500) {
				const hasExpiring = talkMessages.messages.some(m => m.expiresAt && m.expiresAt > 0 && m.expiresAt <= now + 1000);
				if (hasExpiring) {
					talkMessages.cleanupExpired();
					lastCleanup = now;
				}
			}
		}, 1000);
		return () => clearInterval(interval);
	});

	// Auto-scroll
	$effect(() => {
		const count = talkMessages.messages.length;
		if (!endMarker || !container || count === 0) return;
		queueMicrotask(() => {
			if (!container || !endMarker) return;
			const { scrollTop, scrollHeight, clientHeight } = container;
			const nb = scrollTop + clientHeight > scrollHeight - 100;
			const last = talkMessages.messages[count - 1];
			const isOwn = last?.username === talkAuth.username;
			if (!didInitialScroll || isOwn) {
				endMarker.scrollIntoView({ behavior: 'smooth' });
				didInitialScroll = true;
				return;
			}
			if (nb || scrollHeight <= clientHeight) {
				endMarker.scrollIntoView({ behavior: 'smooth' });
			}
		});
	});

	// Click outside swipe
	$effect(() => {
		if (!swipe.id) return;
		const handler = (e: MouseEvent) => {
			const t = e.target as HTMLElement;
			if (!t.closest('.action-buttons') && !t.closest('.bubble-wrapper')) closeSwipe();
		};
		document.addEventListener('click', handler);
		return () => document.removeEventListener('click', handler);
	});

	$effect(() => () => cancelAnimationFrame(scrollRAF));

	function closeSwipe() {
		swipe.id = null;
		swipe.shift = 0;
		swipe.dragging = false;
	}

	function handleScroll() {
		cancelAnimationFrame(scrollRAF);
		scrollRAF = requestAnimationFrame(() => {
			if (!container) return;
			const { scrollTop, scrollHeight, clientHeight } = container;
			nearBottom = scrollTop + clientHeight >= scrollHeight - 100;
			headerVisible = scrollTop < 50 || scrollTop < prevScrollTop;
			prevScrollTop = scrollTop;
			if (nearBottom && talkMessages.unreadCount > 0) talkMessages.markAsRead();
		});
	}

	function scrollToBottom() {
		endMarker?.scrollIntoView({ behavior: 'smooth' });
		if (talkMessages.unreadCount > 0) talkMessages.markAsRead();
	}

	function onPointerDown(e: PointerEvent, msg: TalkMessage) {
		if (msg.username !== talkAuth.username) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		if (swipe.id && swipe.id !== msg.id) closeSwipe();
		swipe.startX = e.clientX;
		swipe.dragging = true;
		swipe.id = msg.id;
	}

	function onPointerMove(e: PointerEvent) {
		if (!swipe.dragging || !swipe.id) return;
		const dx = swipe.startX - e.clientX;
		if (dx <= 0) { swipe.shift = 0; return; }
		const norm = Math.min(dx / SWIPE_THRESHOLD, 2);
		swipe.shift = Math.min(SWIPE_THRESHOLD * (1 - Math.exp(-norm * 1.5)), SWIPE_THRESHOLD);
	}

	function onPointerUp(e: PointerEvent) {
		try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
		if (!swipe.dragging) { if (swipe.id) closeSwipe(); return; }
		swipe.dragging = false;
		swipe.shift = swipe.shift > SWIPE_THRESHOLD * 0.5 ? SWIPE_THRESHOLD : 0;
		if (swipe.shift === 0) swipe.id = null;
	}

	function onPointerCancel(e: PointerEvent) {
		try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
		closeSwipe();
	}

	async function retry(msg: TalkMessage) {
		if (msg.status === 'failed') await talkMessages.retry(msg.id, msg.username);
	}

	async function deleteMsg(id: string) {
		if (confirm('Delete this message?')) {
			await talkMessages.delete(id);
			closeSwipe();
		}
	}

	// Props are bindable, no need for exports
</script>

<div class="messages-container" class:no-header={!headerVisible} bind:this={container} onscroll={handleScroll}>
	{#each talkMessages.messages as msg, i (msg.id)}
		{@const isOwn = msg.username === talkAuth.username}
		{@const grouped = shouldGroup(talkMessages.messages, i)}
		{@const showDate = shouldShowDate(talkMessages.messages, i)}
		{@const showTime = shouldShowTime(talkMessages.messages, i)}
		{@const swiped = swipe.id === msg.id}
		{@const isLast = i === talkMessages.messages.length - 1}
		{@const isDisappearing = msg.expiresAt && msg.expiresAt > 0}
		{@const timeLeft = isDisappearing && tick >= 0 ? Math.max(0, Math.ceil((msg.expiresAt! - Date.now()) / 1000)) : 0}

		{#if showDate}
			<div class="date-divider" transition:fade={{ duration: transitionDuration }}>
				<span>{formatDate(msg.timestamp)}</span>
			</div>
		{/if}

		{#key msg.id}
			<div class="message" class:own={isOwn} class:grouped in:fly={flyParams}>
				{#if !grouped && !isOwn}
					<div class="avatar">{msg.username.charAt(0).toUpperCase()}</div>
				{:else if !isOwn}
					<div class="avatar-spacer"></div>
				{/if}

				<div class="message-content">
					{#if !grouped && !isOwn}
						<div class="message-username">{msg.username}</div>
					{/if}

					<div class="message-row">
						{#if isOwn}
							<div class="swipe-container">
								<div 
									class="bubble-wrapper" 
									style="transform: translateX({swiped ? -swipe.shift : 0}px); transition: {swipe.dragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};"
									onpointerdown={(e) => onPointerDown(e, msg)}
									onpointermove={onPointerMove}
									onpointerup={onPointerUp}
									onpointercancel={onPointerCancel}
									role="button"
									tabindex="0"
								>
									<div class="bubble-meta" class:always-visible={isLast}>
										{#if isDisappearing && timeLeft > 0}
											<div class="disappear-timer">
												<iconify-icon icon="mdi:clock-outline" width="14"></iconify-icon>
												<span>{timeLeft}s</span>
											</div>
										{/if}
										{#if showTime || isLast}
											<span class="time">{formatTime(msg.timestamp)}</span>
										{/if}
										{#if msg.status === 'pending'}
											<span class="status pending" title="Sending...">⏳</span>
										{:else if msg.status === 'sent'}
											<span class="status sent" title="Sent">✓</span>
										{:else if msg.status === 'failed'}
											<button class="status failed" title="Retry" onclick={() => retry(msg)}>⚠️</button>
										{/if}
									</div>
									<div class="bubble own" class:pending={msg.status === 'pending'} class:failed={msg.status === 'failed'} class:disappearing={isDisappearing}>
										{msg.text}
									</div>
								</div>
								<div class="action-buttons" style="width: {swiped ? swipe.shift : 0}px; transition: {swipe.dragging ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};">
									<button onclick={() => onEditRequest?.(msg)} title="Edit" aria-label="Edit">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
										</svg>
									</button>
									<button class="delete-btn" onclick={() => deleteMsg(msg.id)} title="Delete" aria-label="Delete">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
										</svg>
									</button>
								</div>
							</div>
						{:else}
							<div class="bubble-wrapper">
								<div class="bubble" class:pending={msg.status === 'pending'} class:failed={msg.status === 'failed'} class:disappearing={isDisappearing}>
									{msg.text}
								</div>
								<div class="bubble-meta" class:always-visible={isLast}>
									{#if isDisappearing && timeLeft > 0}
										<div class="disappear-timer">
											<iconify-icon icon="mdi:clock-outline" width="14"></iconify-icon>
											<span>{timeLeft}s</span>
										</div>
									{/if}
									{#if showTime || isLast}
										<span class="time">{formatTime(msg.timestamp)}</span>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/key}
	{/each}
	<div bind:this={endMarker}></div>
</div>

<!-- Scroll button -->
{#if !nearBottom}
	<button class="scroll-bottom" onclick={scrollToBottom} transition:fly={{ y: 10, duration: 200 }} aria-label="Scroll to bottom">
		{#if talkMessages.unreadCount > 0}
			<span class="unread-badge" transition:fly={{ y: -10, duration: 150 }}>{talkMessages.unreadCount}</span>
		{/if}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M12 5v14M19 12l-7 7-7-7" />
		</svg>
	</button>
{/if}

<style>
	.messages-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: calc(52px + 1rem) 1rem 5rem;
		display: flex;
		flex-direction: column;
		gap: 2px;
		box-shadow: inset 0 8px 14px -12px rgba(0, 0, 0, 0.65);
		-webkit-user-select: text;
		user-select: text;
	}

	.messages-container.no-header {
		padding-top: 1rem;
	}

	.date-divider {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
	}

	.date-divider span {
		font: 0.7rem var(--font-read);
		color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.08);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		user-select: none;
	}

	.message {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.message.grouped { margin-top: 2px; }
	.message.own { flex-direction: row-reverse; }

	.avatar {
		width: 28px;
		height: 28px;
		min-width: 28px;
		border-radius: 50%;
		background: #0a84ff;
		display: flex;
		align-items: center;
		justify-content: center;
		font: 600 0.75rem var(--font-read);
		color: #0a0a0a;
		text-transform: uppercase;
		user-select: none;
	}

	.avatar-spacer { width: 28px; min-width: 28px; }

	.message-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: min(75%, 600px);
	}

	.message.own .message-content { align-items: flex-end; }

	.message-username {
		font: 500 0.75rem var(--font-read);
		color: rgba(255, 255, 255, 0.6);
		padding: 0 0.5rem 0.125rem;
		user-select: none;
	}

	.message-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		position: relative;
	}

	.message.own .message-row { flex-direction: row-reverse; }

	.swipe-container {
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}

	.bubble-wrapper {
		position: relative;
		z-index: 2;
		touch-action: pan-y;
		cursor: grab;
		user-select: none;
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		gap: 0.5rem;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.bubble-wrapper:active { cursor: grabbing; }

	.bubble-meta {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding-bottom: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.bubble-wrapper:hover .bubble-meta, .bubble-meta.always-visible { opacity: 1; }

	.bubble {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 18px;
		padding: 0.65rem 0.9rem;
		font: 0.95rem/1.4 var(--font-read);
		color: #fff;
		white-space: pre-wrap;
		word-wrap: break-word;
		transition: all 0.15s;
	}

	.bubble:hover { background: rgba(255, 255, 255, 0.15); }

	.bubble.own {
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		border: none;
		box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
	}

	.bubble.own:hover {
		background: linear-gradient(135deg, #0071f2 0%, #005bb5 100%);
		box-shadow: 0 2px 12px rgba(10, 132, 255, 0.4);
	}

	.bubble.pending {
		background: linear-gradient(135deg, rgba(10, 132, 255, 0.6) 0%, rgba(0, 102, 204, 0.6) 100%);
		border: 1px solid rgba(255, 255, 255, 0.3);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.bubble.failed {
		border-color: rgba(255, 100, 100, 0.5);
		background: rgba(255, 100, 100, 0.15);
	}

	.bubble.disappearing {
		background: transparent !important;
		border: 2px solid rgba(255, 255, 255, 0.12);
		box-shadow: none !important;
	}

	.bubble.disappearing:hover {
		background: rgba(10, 132, 255, 0.05) !important;
		border-color: #0071f2;
	}

	.disappear-timer {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font: 600 0.7rem var(--font-ui);
		color: #ff9500;
		background: rgba(255, 255, 255, 0.12);
		padding: 0.2rem 0.5rem;
		border-radius: 8px;
		user-select: none;
	}

	.time {
		font: 0.7rem var(--font-read);
		color: rgba(255, 255, 255, 0.4);
		white-space: nowrap;
		user-select: none;
	}

	.status {
		font: 0.7rem/1 var(--font-ui);
		user-select: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.status.pending { animation: spin 1s linear infinite; color: #0a84ff; }
	.status.sent { color: rgba(255, 255, 255, 0.6); }
	.status.failed {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: #ff453a;
		transition: color 0.2s;
	}
	.status.failed:hover { color: #ff6347; }

	@keyframes spin { to { transform: rotate(360deg); } }
	@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

	.action-buttons {
		display: flex;
		align-items: center;
		justify-content: space-evenly;
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		z-index: 1;
		overflow: hidden;
		height: 100%;
	}

	.action-buttons button {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: none;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
		color: #fff;
		padding: 0;
	}

	.action-buttons button:hover { color: #0071f2; }
	.action-buttons .delete-btn:hover { color: #dc2626; }
	.action-buttons button:active { transform: scale(0.95); }

	.scroll-bottom {
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
	}

	.scroll-bottom:hover {
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4);
	}

	.scroll-bottom:active { transform: scale(0.95); }

	.unread-badge {
		position: absolute;
		top: -6px;
		right: -6px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 9px;
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		color: #fff;
		font: 600 0.7rem var(--font-read);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 6px rgba(10, 132, 255, 0.5), 0 0 0 2px #0a0a0a;
	}
</style>
