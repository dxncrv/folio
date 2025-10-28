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
	
	// Swipe-to-reveal state
	let swipedMessageId = $state<string | null>(null);
	let swipeShift = $state(0);
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartTime = 0;
	let pressHoldTimer: number | null = null;
	
	// Edit modal state
	let editingMessageId = $state<string | null>(null);
	let editText = $state('');

	// Context7: Derived transition params based on motion preference
	const transitionParams = $derived(
		prefersReducedMotion.current 
			? { duration: 150 } 
			: { y: 20, duration: 300, easing: quintOut }
	);
	
	const SWIPE_THRESHOLD = 80; // pixels to fully reveal buttons
	const PRESS_HOLD_DURATION = 200; // ms before swipe activates

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
			// Context7: Mark messages as read when scrolling to bottom
			talkMessages.markAsRead();
		}
	});
	
	// Context7: Mark as read when near bottom
	$effect(() => {
		if (isNearBottom && talkMessages.messages.length > 0) {
			talkMessages.markAsRead();
		}
	});
	
	// Close swipe on outside tap
	$effect(() => {
		if (!swipedMessageId) return;
		
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			// Don't close if clicking action buttons or the bubble itself
			if (target.closest('.action-buttons') || target.closest('.bubble-wrapper')) {
				return;
			}
			closeSwipe();
		};
		
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	// Swipe-to-reveal gesture handlers
	function handlePointerDown(e: PointerEvent, msg: typeof talkMessages.messages[number]) {
		// Only allow swiping user's own messages
		if (msg.username !== talkAuth.username) return;
		
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);
		
		dragStartX = e.clientX;
		dragStartTime = Date.now();
		isDragging = false;
		
		// Start press-and-hold timer
		pressHoldTimer = window.setTimeout(() => {
			isDragging = true;
			swipedMessageId = msg.id;
		}, PRESS_HOLD_DURATION);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging || !swipedMessageId) return;
		
		const deltaX = dragStartX - e.clientX;
		if (deltaX < 0) {
			// Don't allow swiping right
			swipeShift = 0;
			return;
		}
		
		// Exponential easing for smooth feel
		const normalizedDelta = Math.min(deltaX / SWIPE_THRESHOLD, 2);
		const easedShift = SWIPE_THRESHOLD * (1 - Math.exp(-normalizedDelta * 1.5));
		swipeShift = Math.min(easedShift, SWIPE_THRESHOLD);
	}

	function handlePointerUp(e: PointerEvent) {
		if (pressHoldTimer !== null) {
			clearTimeout(pressHoldTimer);
			pressHoldTimer = null;
		}
		
		const target = e.currentTarget as HTMLElement;
		target.releasePointerCapture(e.pointerId);
		
		if (!isDragging) {
			// Was just a tap, not a swipe
			return;
		}
		
		isDragging = false;
		
		// Snap to fully revealed or closed
		if (swipeShift > SWIPE_THRESHOLD * 0.5) {
			swipeShift = SWIPE_THRESHOLD;
		} else {
			swipeShift = 0;
			swipedMessageId = null;
		}
	}

	function handlePointerCancel() {
		if (pressHoldTimer !== null) {
			clearTimeout(pressHoldTimer);
			pressHoldTimer = null;
		}
		isDragging = false;
		swipeShift = 0;
		swipedMessageId = null;
	}

	function closeSwipe() {
		swipeShift = 0;
		swipedMessageId = null;
	}

	// Edit modal handlers
	function startEdit(msg: typeof talkMessages.messages[number]) {
		editingMessageId = msg.id;
		editText = msg.text;
		closeSwipe();
	}

	function cancelEdit() {
		editingMessageId = null;
		editText = '';
	}

	async function saveEdit() {
		if (!editText.trim() || !editingMessageId) return;
		const success = await talkMessages.edit(editingMessageId, editText);
		if (success) {
			editingMessageId = null;
			editText = '';
		}
	}

	async function deleteMsg(messageId: string) {
		if (!confirm('Delete this message?')) return;
		closeSwipe();
		await talkMessages.delete(messageId);
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			saveEdit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelEdit();
		}
	}
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
						{#if msg.username === talkAuth.username}
							<div class="swipe-container">
								<div 
									class="bubble-wrapper"
									style="transform: translateX({swipedMessageId === msg.id ? -swipeShift : 0}px); transition: {isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};"
									onpointerdown={(e) => handlePointerDown(e, msg)}
									onpointermove={handlePointerMove}
									onpointerup={handlePointerUp}
									onpointercancel={handlePointerCancel}
									role="button"
									tabindex="0"
								>
									<div class="bubble own">{msg.text}</div>
								</div>
								<div 
									class="action-buttons"
									style="width: {swipedMessageId === msg.id ? swipeShift : 0}px; transition: {isDragging ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};"
								>
									<button 
										onclick={() => startEdit(msg)} 
										class="action-btn edit" 
										title="Edit" 
										aria-label="Edit message"
									>
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
											<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
										</svg>
									</button>
									<button 
										onclick={() => deleteMsg(msg.id)} 
										class="action-btn delete" 
										title="Delete" 
										aria-label="Delete message" 
										disabled={talkMessages.deleting}
									>
										<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="3 6 5 6 21 6"></polyline>
											<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
										</svg>
									</button>
								</div>
							</div>
							<!-- Context7: Phase 2, Item 7 - Message status indicators -->
							{#if msg.status === 'pending'}
								<span class="status pending" title="Sending..." aria-label="Sending">⏳</span>
							{:else if msg.status === 'sent'}
								<span class="status sent" title="Sent" aria-label="Sent">✓</span>
							{:else if msg.status === 'failed'}
								<span class="status failed" title="Failed to send" aria-label="Failed">⚠️</span>
							{/if}
						{:else}
							<div class="bubble">{msg.text}</div>
						{/if}
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

<!-- Scroll to bottom button - Phase 1 feature -->
{#if !isNearBottom}
	<button 
		class="scroll-to-bottom"
		onclick={() => {
			scrollToBottom();
			if (talkMessages.unreadCount > 0) {
				talkMessages.markAsRead();
			}
		}}
		transition:fly={{ y: 20, duration: 200 }}
		aria-label={talkMessages.unreadCount > 0 ? `Scroll to bottom (${talkMessages.unreadCount} unread)` : "Scroll to bottom"}
		title={talkMessages.unreadCount > 0 ? `${talkMessages.unreadCount} new ${talkMessages.unreadCount === 1 ? 'message' : 'messages'}` : "Scroll to bottom"}
	>
		<!-- Context7: Phase 2, Item 8 - Unread count badge -->
		{#if talkMessages.unreadCount > 0}
			<span class="unread-badge" transition:fly={{ y: -10, duration: 150 }}>
				{talkMessages.unreadCount}
			</span>
		{/if}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 5v14M19 12l-7 7-7-7"/>
		</svg>
	</button>
{/if}

<!-- Edit Modal -->
{#if editingMessageId}
	<div 
		class="modal-backdrop" 
		onclick={cancelEdit}
		onkeydown={(e) => e.key === 'Escape' && cancelEdit()}
		role="button"
		tabindex="0"
		transition:fade={{ duration: 200 }}
	>
		<div 
			class="modal" 
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-labelledby="modal-title"
			tabindex="-1"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="modal-header">
				<h3 id="modal-title">Edit Message</h3>
				<button onclick={cancelEdit} class="close-btn" aria-label="Close">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<textarea
				bind:value={editText}
				onkeydown={handleEditKeydown}
				class="modal-input"
				placeholder="Edit your message..."
			></textarea>
			<div class="modal-actions">
				<button onclick={cancelEdit} class="modal-btn cancel">Cancel</button>
				<button onclick={saveEdit} class="modal-btn save" disabled={talkMessages.editing || !editText.trim()}>
					{talkMessages.editing ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</div>
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
		position: relative;
	}

	.msg.own .msg-row {
		flex-direction: row-reverse;
	}

	/* Swipe-to-reveal container */
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
	}

	.bubble-wrapper:active {
		cursor: grabbing;
	}

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

	/* Action buttons - styled like scroll-to-bottom */
	.action-btn {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.8);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: background-color, transform;
		flex-shrink: 0;
		color: #fff;
	}

	.action-btn:hover:not(:disabled) {
		color: #0071f2;
	}

	.action-btn.delete:hover:not(:disabled) {
		color: #dc2626;
	}

	.action-btn:active:not(:disabled) {
		transform: scale(0.95) translateZ(0);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn svg {
		width: 16px;
		height: 16px;
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
		position: relative;
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

	/* Phase 2, Item 7 - Message status indicators */
	.status {
		font-size: 0.9rem;
		flex-shrink: 0;
		padding-bottom: 0.125rem;
		user-select: none;
		pointer-events: none;
		opacity: 0.8;
		display: flex;
		align-items: center;
	}

	.status.pending {
		animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.status.sent {
		color: var(--accent);
	}

	.status.failed {
		color: rgba(239, 68, 68, 0.9);
		cursor: pointer;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.8; }
		50% { opacity: 0.4; }
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

	/* Phase 2, Item 8 - Unread count badge on button */
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
		box-shadow: 0 2px 6px rgba(10, 132, 255, 0.5), 0 0 0 2px var(--body-bg, #0a0a0a);
		pointer-events: none;
		line-height: 1;
	}

	/* Edit Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal {
		background: var(--body-bg, #0a0a0a);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		max-width: 500px;
		width: 100%;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-header h3 {
		font: 600 1.1rem var(--font-ui);
		color: #fff;
		margin: 0;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: none;
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.modal-input {
		flex: 1;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0;
		padding: 1rem 1.25rem;
		color: #fff;
		font: 0.95rem/1.5 var(--font-read);
		resize: vertical;
		outline: none;
		min-height: 120px;
		transition: border-color 0.15s;
	}

	.modal-input:focus {
		border-color: rgba(10, 132, 255, 0.5);
		background: rgba(255, 255, 255, 0.08);
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		justify-content: flex-end;
	}

	.modal-btn {
		padding: 0.65rem 1.25rem;
		border-radius: 8px;
		font: 500 0.9rem var(--font-ui);
		cursor: pointer;
		transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		border: none;
		will-change: background-color, transform;
	}

	.modal-btn.cancel {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-btn.cancel:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
	}

	.modal-btn.save {
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		color: #fff;
		min-width: 80px;
	}

	.modal-btn.save:hover:not(:disabled) {
		background: linear-gradient(135deg, #0071f2 0%, #005bb5 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4);
	}

	.modal-btn.save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.msg-content {
			max-width: 80%;
		}

		.scroll-to-bottom {
			bottom: calc(48px + 1rem + 0.75rem);
			right: 1rem;
		}

		.modal {
			max-width: 100%;
			max-height: 90vh;
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
