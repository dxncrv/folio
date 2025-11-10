<!--
Ground-up rewrite of chat.svelte for Svelte 5 optimization
Fully self-contained, no external component dependencies
-->

<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { MediaQuery } from 'svelte/reactivity';
	import { tick } from 'svelte';
	import { talkAuth } from './chat/talk-auth.svelte';
	import { talkMessages, formatDate, formatTime, shouldGroup, shouldShowDate, shouldShowTime } from './chat/talk-messages.svelte';
	import type { TalkMessage } from '$lib/types';

	// ===== MOTION PREFERENCES =====
	const motionQuery = new MediaQuery('(prefers-reduced-motion: reduce)');
	const prefersReducedMotion = $derived(motionQuery.current);
	const transitionDuration = $derived(prefersReducedMotion ? 0 : 300);
	const flyParams = $derived(prefersReducedMotion ? { duration: 0 } : { y: 20, duration: 300, easing: quintOut });

	// ===== STATE MANAGEMENT =====
	const MAX_LENGTH = 250;
	const SWIPE_THRESHOLD = 80;

	// Consolidated auth state
	let auth = $state({ username: '', error: '', touched: false });
	
	// Consolidated UI state
	let ui = $state({ headerVisible: true, isLive: false });
	
	// Message list state with refs
	let messagesContainer: HTMLDivElement | undefined = $state();
	let messagesEnd: HTMLDivElement | undefined = $state();
	let scrollRAF = 0;
	let didInitialAutoScroll = $state(false);
	
	// Input state
	let messageText = $state('');
	let textarea: HTMLTextAreaElement | undefined = $state();
	
	// Consolidated edit modal state
	let editModal = $state({ id: null as string | null, text: '', visible: false });
	
	// Consolidated swipe gesture state
	let gesture = $state({ swipedId: null as string | null, shift: 0, isDragging: false, startX: 0, startTime: 0 });

	// ===== DERIVED STATE =====
	const isLoading = $derived(talkAuth.checkingSession);
	const isAuthenticated = $derived(talkAuth.authenticated);
	
	// Auth validation (using consolidated auth object)
	const authValid = $derived.by(() => {
		const trimmed = auth.username.trim().toLowerCase();
		return trimmed.length >= 2 && trimmed.length <= 20 && /^[a-z0-9_]+$/.test(trimmed);
	});
	const canSubmitAuth = $derived(!talkAuth.loading && authValid);
	
	// Input validation (optimized with early computation)
	const messageLength = $derived(messageText.length);
	const trimmedLength = $derived(messageText.trim().length);
	const canSend = $derived(!talkMessages.sending && trimmedLength > 0 && messageLength <= MAX_LENGTH);
	const remainingChars = $derived(MAX_LENGTH - messageLength);
	const showCounter = $derived(messageLength > MAX_LENGTH * 0.8);
	const isWarning = $derived(remainingChars < 100);
	
	// Scroll tracking state (reactive to scroll events)
	let nearBottom = $state(true);
	let prevScrollTop = $state(0);

	// ===== HELPER FUNCTIONS =====
	function closeSwipe() {
		gesture.swipedId = null;
		gesture.shift = 0;
		gesture.isDragging = false;
	}

	// ===== LIFECYCLE EFFECTS =====
	
	// Session restoration on mount
	$effect(() => {
		(async () => {
			const restored = await talkAuth.restoreSession();
			if (restored) {
				talkMessages.setUsername(talkAuth.username);
				await talkMessages.fetch();
				talkMessages.markAsRead();
				// Scroll to bottom after DOM update
				await tick();
				if (messagesEnd) {
					messagesEnd.scrollIntoView({ behavior: 'auto' });
					didInitialAutoScroll = true;
				}
			}
		})();
	});
	
	// SSE + polling for real-time + resilience
	$effect(() => {
		if (!ui.isLive || !isAuthenticated) return;
		
		console.log('[Talk] 🔄 SSE + polling started');
		let eventSource: EventSource | null = null;
		let fallbackPoll: ReturnType<typeof setInterval> | null = null;
		let liveTimeout: ReturnType<typeof setTimeout> | null = null;
		
		// SSE for real-time updates (optimized: SSE triggers immediate fetch, no redundant polling)
		try {
			eventSource = new EventSource('/api/talk/stream', { withCredentials: true });
			
			eventSource.addEventListener('message', (ev: Event) => {
				if (!(ev instanceof MessageEvent)) return;
				try {
					const event = JSON.parse(ev.data);
					// Optimized: Delta sync via single fetch after SSE notification
					talkMessages.fetch();
				} catch (e) {
					console.error('[SSE] Parse error:', e);
				}
			});
			
			eventSource.addEventListener('error', () => {
				console.log('[SSE] Connection lost, activating fallback polling');
				eventSource?.close();
				eventSource = null;
				// Fallback: poll every 5s (only when SSE is unavailable)
				if (!fallbackPoll) {
					fallbackPoll = setInterval(() => talkMessages.fetch(), 5000);
				}
			});
		} catch (e) {
			console.error('[SSE] Setup failed:', e);
			// Fallback immediately if SSE init fails
			fallbackPoll = setInterval(() => talkMessages.fetch(), 5000);
		}
		
		// 5-minute timeout for live mode
		liveTimeout = setTimeout(() => {
			console.log('[Talk] ⏱️ Live mode timed out');
			ui.isLive = false;
		}, 5 * 60 * 1000);
		
		return () => {
			eventSource?.close();
			if (fallbackPoll) clearInterval(fallbackPoll);
			if (liveTimeout) clearTimeout(liveTimeout);
			console.log('[Talk] ⏹️ Live updates stopped');
		};
	});
	
	// Auto-scroll logic using $effect (runs AFTER DOM updates, when messages.length changes)
	// Handles: initial load, own messages, near-bottom scrolling
	$effect(() => {
		// Track messages.length to trigger on new messages (messages uses $state.raw)
		const msgCount = talkMessages.messages.length;
		if (!messagesEnd || !messagesContainer || msgCount === 0) return;
		
		// Wait for DOM to update, then check scroll position
		queueMicrotask(() => {
			if (!messagesContainer || !messagesEnd) return;
			
			const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
			const isNearBottom = scrollTop + clientHeight > scrollHeight - 100;
			const lastMsg = talkMessages.messages[msgCount - 1];
			const isOurMessage = lastMsg?.username === talkAuth.username;
			
			// Force scroll on: initial load OR sending own message
			if (!didInitialAutoScroll || isOurMessage) {
				messagesEnd.scrollIntoView({ behavior: 'smooth' });
				if (!didInitialAutoScroll) {
					didInitialAutoScroll = true;
				}
				return;
			}
			
			// Auto-scroll if near bottom or content shorter than viewport
			if (isNearBottom || scrollHeight <= clientHeight) {
				messagesEnd.scrollIntoView({ behavior: 'smooth' });
			}
		});
	});
	
	// Event listeners for swipe and modal cleanup
	$effect(() => {
		if (!gesture.swipedId) return;
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest('.action-buttons') && !target.closest('.bubble-wrapper')) closeSwipe();
		};
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
	
	$effect(() => {
		if (!editModal.visible) return;
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeEditModal();
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	});
	
	// Cleanup scroll RAF
	$effect(() => cancelAnimationFrame(scrollRAF));

	// ===== EVENT HANDLERS =====
    
	// Auth handlers
	// Auth submission
	async function handleAuthSubmit() {
		if (!canSubmitAuth) return;
		auth.touched = true;
		auth.error = '';
		const success = await talkAuth.login(auth.username.trim().toLowerCase());
		if (!success) {
			auth.error = talkAuth.error;
			return;
		}
		auth.username = '';
		auth.touched = false;
		talkMessages.setUsername(talkAuth.username);
		await talkMessages.fetch();
	}

	function handleAuthKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !talkAuth.loading) {
			e.preventDefault();
			handleAuthSubmit();
		}
	}
	
	// Edit modal
	function openEditModal(msg: TalkMessage) {
		editModal.id = msg.id;
		editModal.text = msg.text;
		editModal.visible = true;
		closeSwipe();
	}
	
	function closeEditModal() {
		editModal.visible = false;
		editModal.id = null;
		editModal.text = '';
	}
	
	async function saveEdit() {
		if (!editModal.id || !editModal.text.trim()) return;
		if (await talkMessages.edit(editModal.id, editModal.text.trim())) {
			closeEditModal();
		}
	}
    
	// Message send/input
	async function sendMessage() {
		if (!canSend) return;
		const text = messageText.trim();
		messageText = '';
		const sendPromise = talkMessages.send(text, talkAuth.username);
		await tick();
		messagesEnd?.scrollIntoView({ behavior: 'smooth' });
		if (!await sendPromise) messageText = text;
		await tick();
		textarea?.focus();
	}
    
	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !talkMessages.sending) {
			e.preventDefault();
			sendMessage();
		}
	}
    
	// Message operations
	async function deleteMessage(messageId: string) {
		if (confirm('Delete this message?')) {
			await talkMessages.delete(messageId);
			closeSwipe();
		}
	}
    
	async function retryMessage(msg: TalkMessage) {
		if (msg.status === 'failed') {
			await talkMessages.retry(msg.id, msg.username);
		}
	}
    
	function scrollToBottom() {
		messagesEnd?.scrollIntoView({ behavior: 'smooth' });
	}

	// Scroll detection
	function handleScroll() {
		cancelAnimationFrame(scrollRAF);
		scrollRAF = requestAnimationFrame(() => {
			if (!messagesContainer) return;
			const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
			const st = scrollTop;
			// Consider 'near bottom' within 100px
			const nb = st + clientHeight >= scrollHeight - 100;
			nearBottom = nb;
			// Show header when near top or when user scrolls up
			const delta = st - prevScrollTop;
			ui.headerVisible = st < 50 || delta < 0;
			prevScrollTop = st;
			// If we reached the bottom, mark messages as read
			if (nb && talkMessages.unreadCount > 0) talkMessages.markAsRead();
		});
	}
    
	// Swipe gesture handlers (consolidated state)
	function handlePointerDown(e: PointerEvent, msg: TalkMessage) {
		if (msg.username !== talkAuth.username) return;
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);
		
		if (gesture.swipedId !== msg.id && gesture.swipedId) closeSwipe();
		gesture.startX = e.clientX;
		gesture.startTime = Date.now();
		gesture.isDragging = true;
		gesture.swipedId = msg.id;
	}
	
	function handlePointerMove(e: PointerEvent) {
		if (!gesture.isDragging || !gesture.swipedId) return;
		const deltaX = gesture.startX - e.clientX;
		if (deltaX <= 0) {
			gesture.shift = 0;
			return;
		}
		const normalized = Math.min(deltaX / SWIPE_THRESHOLD, 2);
		gesture.shift = Math.min(SWIPE_THRESHOLD * (1 - Math.exp(-normalized * 1.5)), SWIPE_THRESHOLD);
	}
	
	function handlePointerUp(e: PointerEvent) {
		const target = e.currentTarget as HTMLElement;
		try { target.releasePointerCapture(e.pointerId); } catch {}
		if (!gesture.isDragging) {
			if (gesture.swipedId) closeSwipe();
			return;
		}
		gesture.isDragging = false;
		gesture.shift = gesture.shift > SWIPE_THRESHOLD * 0.5 ? SWIPE_THRESHOLD : 0;
		if (gesture.shift === 0) gesture.swipedId = null;
	}
	
	function handlePointerCancel(e: PointerEvent) {
		try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
		closeSwipe();
	}
</script>

<!-- ===== TEMPLATE ===== -->
<div class="chat-wrapper">
	{#if isLoading}
		<!-- Session loader -->
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
		<!-- Auth card -->
		<div class="auth-container" in:fade={{ duration: transitionDuration }}>
			<div class="auth-card">
				<div class="auth-icon">💬</div>
				<h2>Talk</h2>
				<p class="subtitle">Enter your name to start chatting</p>
				<input
					type="text"
					bind:value={auth.username}
					onkeydown={handleAuthKeydown}
					onblur={() => auth.touched = true}
					placeholder="Your name"
					disabled={talkAuth.loading}
					autocomplete="off"
					aria-invalid={auth.touched && !authValid}
				/>
				{#if auth.touched && !authValid}
					<div class="error" transition:fly={flyParams}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
							<path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
						2-20 chars, letters/numbers/underscore only
					</div>
				{/if}
				{#if auth.error}
					<div class="error server-error" transition:fly={flyParams}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
							<path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
						{auth.error}
					</div>
				{/if}
				<button onclick={handleAuthSubmit} disabled={!canSubmitAuth} class:loading={talkAuth.loading}>
					{talkAuth.loading ? 'Joining...' : 'Continue'}
				</button>
			</div>
		</div>
	{:else}
		<!-- Main chat interface -->
		<div class="chat-container">
			<!-- Header -->
			<header class:hidden={!ui.headerVisible}>
				<h3>Talk</h3>
				<div class="user-info">
					<div class="live-toggle">
						<label for="live-toggle" class="toggle-label">
							<span class="toggle-text">Live</span>
							<button 
								id="live-toggle"
								class="toggle-switch" 
								class:active={ui.isLive}
								onclick={() => ui.isLive = !ui.isLive}
								title={ui.isLive ? "Disable live updates" : "Enable live updates for 5 minutes"}
								aria-label={ui.isLive ? "Disable live updates" : "Enable live updates"}
							>
								<span class="toggle-slider"></span>
							</button>
						</label>
					</div>
					<span>{talkAuth.username}</span>
					<button onclick={() => talkAuth.logout()} title="Logout" aria-label="Logout">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
						</svg>
					</button>
				</div>
			</header>
            
			<!-- Messages -->
			<div class="messages-container" bind:this={messagesContainer} onscroll={handleScroll}>
				{#each talkMessages.messages as msg, i (msg.id)}
					{@const isOwn = msg.username === talkAuth.username}
					{@const grouped = shouldGroup(talkMessages.messages, i)}
					{@const showDate = shouldShowDate(talkMessages.messages, i)}
					{@const showTime = shouldShowTime(talkMessages.messages, i)}
					{@const swiped = gesture.swipedId === msg.id}
					{@const isLast = i === talkMessages.messages.length - 1}
                    
					{#if showDate}
						<div class="date-divider" transition:fade={{ duration: transitionDuration }}>
							<span>{formatDate(msg.timestamp)}</span>
						</div>
					{/if}
                    
					{#key msg.id}
						<div 
							class="message" 
							class:own={isOwn} 
							class:grouped={grouped}
							in:fly={flyParams}
						>
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
										<div class="bubble-wrapper" style="transform: translateX({swiped ? -gesture.shift : 0}px); transition: {gesture.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};"
											onpointerdown={(e) => handlePointerDown(e, msg)}
											onpointermove={handlePointerMove}
											onpointerup={handlePointerUp}
											onpointercancel={handlePointerCancel}
											role="button"
											tabindex="0"
										>
											<div class="bubble-meta" class:always-visible={isLast}>
												{#if showTime || isLast}
													<span class="time">{formatTime(msg.timestamp)}</span>
												{/if}
												{#if msg.status === 'pending'}
													<span class="status pending" title="Sending..." aria-label="Sending">⏳</span>
												{:else if msg.status === 'sent'}
													<span class="status sent" title="Sent" aria-label="Sent">✓</span>
												{:else if msg.status === 'failed'}
													<button class="status failed" title="Failed - click to retry" aria-label="Failed" onclick={() => retryMessage(msg)}>⚠️</button>
												{/if}
											</div>
											<div 
												class="bubble own"
												class:pending={msg.status === 'pending'}
												class:failed={msg.status === 'failed'}
											>
												{msg.text}
											</div>
										</div>
										<div class="action-buttons" style="width: {swiped ? gesture.shift : 0}px; transition: {gesture.isDragging ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};">
											<button class="edit-btn" onclick={() => openEditModal(msg)} title="Edit" aria-label="Edit message">
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
												</svg>
											</button>
											<button class="delete-btn" onclick={() => deleteMessage(msg.id)} title="Delete" aria-label="Delete message">
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
												</svg>
											</button>
										</div>
									</div>
								{:else}
									<div class="bubble-wrapper">
										<div class="bubble"
											class:pending={msg.status === 'pending'}
											class:failed={msg.status === 'failed'}
										>
											{msg.text}
										</div>
										<div class="bubble-meta" class:always-visible={isLast}>
											{#if showTime || isLast}
												<span class="time">{formatTime(msg.timestamp)}</span>
											{/if}
											{#if isLast && msg.status}
												{#if msg.status === 'pending'}
													<span class="status pending" title="Sending..." aria-label="Sending">⏳</span>
												{:else if msg.status === 'sent'}
													<span class="status sent" title="Sent" aria-label="Sent">✓</span>
												{:else if msg.status === 'failed'}
													<button class="status failed" title="Failed - click to retry" aria-label="Failed" onclick={() => retryMessage(msg)}>⚠️</button>
												{/if}
											{/if}
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
					{/key}
				{/each}
				<div bind:this={messagesEnd}></div>
			</div>
            
			<!-- Scroll to bottom button -->
			{#if !nearBottom}
				<button 
					class="scroll-bottom" 
					onclick={() => {
						scrollToBottom();
						if (talkMessages.unreadCount > 0) {
							talkMessages.markAsRead();
						}
					}} 
					transition:fly={{ y: 10, duration: 200 }} 
					aria-label={talkMessages.unreadCount > 0 ? `Scroll to bottom (${talkMessages.unreadCount} unread)` : "Scroll to bottom"}
					title={talkMessages.unreadCount > 0 ? `${talkMessages.unreadCount} new ${talkMessages.unreadCount === 1 ? 'message' : 'messages'}` : "Scroll to bottom"}
				>
					{#if talkMessages.unreadCount > 0}
						<span class="unread-badge" transition:fly={{ y: -10, duration: 150 }}>
							{talkMessages.unreadCount}
						</span>
					{/if}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 5v14M19 12l-7 7-7-7" />
					</svg>
				</button>
			{/if}
            
			<!-- Input bar -->
			<div class="input-bar">
				<div class="input-wrapper">
					<textarea
						bind:this={textarea}
						bind:value={messageText}
						onkeydown={handleInputKeydown}
						placeholder="Message"
						disabled={talkMessages.sending}
						maxlength={MAX_LENGTH}
						rows="1"
						aria-label="Message input"
						style="field-sizing: content"
					></textarea>
				</div>
				<div class="send-area">
					{#if showCounter}
						<span class="char-counter" class:warning={isWarning} transition:fade={{ duration: 150 }}>
							{remainingChars}
						</span>
					{/if}
					<button onclick={sendMessage} disabled={!canSend} class:active={canSend} aria-label="Send message" title="Send">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M2 10h16m0 0l-7-7m7 7l-7 7" />
						</svg>
					</button>
				</div>
			</div>
		</div>
        
		<!-- Edit modal -->
		{#if editModal.visible}
			<div 
				class="modal-backdrop" 
				onclick={closeEditModal} 
				onkeydown={(e) => e.key === 'Escape' && closeEditModal()}
				role="button"
				tabindex="-1"
				aria-label="Close modal"
				transition:fade={{ duration: 200 }}
			>
				<div 
					class="modal" 
					onclick={(e) => e.stopPropagation()} 
					onkeydown={(e) => e.stopPropagation()}
					role="dialog"
					tabindex="0"
					aria-modal="true"
					aria-labelledby="modal-title"
					transition:fly={{ y: 20, duration: 300 }}
				>
					<h4 id="modal-title">Edit Message</h4>
					<textarea bind:value={editModal.text} rows="3" maxlength={MAX_LENGTH} aria-label="Edit message text"></textarea>
					<div class="modal-actions">
						<button class="cancel" onclick={closeEditModal}>Cancel</button>
						<button class="save" onclick={saveEdit} disabled={!editModal.text.trim()}>Save</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	:root {
		--color-primary: #0a84ff;
		--color-primary-dark: #0066cc;
		--color-primary-hover: #0071f2;
		--color-primary-hover-dark: #005bb5;
		--color-accent: #34c759;
		--color-error: #ff453a;
		--color-error-secondary: #ff6347;
		--color-warning: #ff9500;
		--color-error-light: #dc2626;
		--color-bg-primary: #0a0a0a;
		--color-bg-secondary: rgba(28, 28, 30, 0.98);
		--color-text-primary: #fff;
		--color-text-secondary: rgba(255, 255, 255, 0.6);
		--color-text-tertiary: rgba(255, 255, 255, 0.4);
		--color-border: rgba(255, 255, 255, 0.1);
		--color-border-light: rgba(255, 255, 255, 0.15);
		--color-border-lighter: rgba(255, 255, 255, 0.2);
		--color-border-lightest: rgba(255, 255, 255, 0.3);
		--color-glass: rgba(255, 255, 255, 0.12);
		--color-glass-hover: rgba(255, 255, 255, 0.15);
		--color-glass-focus: rgba(255, 255, 255, 0.08);
		--gradient-primary: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
		--gradient-primary-hover: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary-hover-dark) 100%);
		--transition-base: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		--transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		--transition-slow: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
		--shadow-md: 0 2px 8px rgba(10, 132, 255, 0.3);
		--shadow-lg: 0 4px 12px rgba(10, 132, 255, 0.4);
		--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	/* ===== BASE LAYOUT ===== */
	.chat-wrapper {
		display: flex;
		width: 100%;
		height: 100%;
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
		-webkit-text-size-adjust: 100%;
		contain: layout style;
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
		contain: layout;
		overflow: hidden;
	}

	/* ===== SESSION LOADER ===== */
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

	/* ===== AUTH CARD ===== */
	.auth-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
		padding: 1rem;
	}

	.auth-card {
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 20px;
		padding: 2.5rem 2rem;
		max-width: 380px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.auth-icon {
		font-size: 4rem;
		opacity: 0.9;
	}

	.auth-card h2 {
		font: 700 1.75rem/1 var(--font-ui);
		color: #fff;
		letter-spacing: -0.03em;
		margin: 0;
	}

	.subtitle {
		font: 0.9rem var(--font-read);
		color: rgba(255, 255, 255, 0.6);
		text-align: center;
		margin: -0.5rem 0 0.5rem;
	}

	.auth-card input,
	.auth-card button {
		width: 100%;
		padding: 0.9rem 1rem;
		border-radius: 12px;
		font: 1rem var(--font-read);
		transition: all 0.2s;
	}

	.auth-card input {
		background: var(--color-glass);
		border: 1px solid var(--color-border-lighter);
		color: var(--color-text-primary);
	}

	.auth-card input::placeholder {
		color: var(--color-text-tertiary);
	}

	.auth-card input:focus {
		outline: none;
		background: var(--color-glass-hover);
		border-color: var(--color-border-lightest);
	}

	.auth-card input:focus-visible {
		box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.3);
	}

	.auth-card input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 69, 58, 0.15);
		border: 1px solid rgba(255, 69, 58, 0.3);
		border-radius: 12px;
		color: #ff453a;
		font-size: 0.85rem;
	}

	.error.server-error {
		background: rgba(255, 99, 71, 0.15);
		border-color: rgba(255, 99, 71, 0.3);
		color: #ff6347;
	}

	.auth-card button {
		background: var(--gradient-primary);
		border: none;
		color: var(--color-text-primary);
		font: 600 1rem var(--font-ui);
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4);
		text-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.1);
	}

	.auth-card button:hover:not(:disabled) {
		background: var(--gradient-primary-hover);
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(10, 132, 255, 0.5);
	}

	.auth-card button:active:not(:disabled) {
		transform: translateY(0);
	}

	.auth-card button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ===== HEADER ===== */
	header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(20px);
		display: flex;
		justify-content: space-between;
		align-items: center;
		transform: translateZ(0);
		will-change: transform;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		contain: layout style;
		height: 52px;
	}

	header.hidden {
		transform: translateY(-100%);
	}

	header h3 {
		font: 600 1rem/1 var(--font-ui);
		color: #fff;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.live-toggle {
		display: flex;
		align-items: center;
		padding: 0.35rem 0.5rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
	}

	.toggle-text {
		font: 0.75rem var(--font-read);
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 500;
	}

	.toggle-switch {
		position: relative;
		width: 36px;
		height: 20px !important;
		background: var(--color-border);
		border-radius: 10px;
		border: none;
		cursor: pointer;
		transition: var(--transition-slow);
		padding: 0;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.toggle-switch:hover {
		background: var(--color-border-light);
	}

	.toggle-switch.active {
		background: rgba(52, 199, 89, 0.2);
	}

	.toggle-switch.active:hover {
		background: rgba(52, 199, 89, 0.3);
	}

	.toggle-switch.active .toggle-slider {
		transform: translateX(16px);
		background: var(--color-accent);
		box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
	}

	.toggle-slider {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		transition: transform var(--transition-slow), background-color 0.25s, box-shadow 0.25s;
		box-shadow: var(--shadow-sm);
	}

	.toggle-switch:hover .toggle-slider {
		background: rgba(255, 255, 255, 0.8);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	.user-info span {
		font: 0.9rem var(--font-ui);
		color: rgba(255, 255, 255, 0.9);
		user-select: none;
	}

	.user-info button {
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		background: var(--color-border);
		color: rgba(255, 255, 255, 0.7);
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-base);
		will-change: background-color, color;
	}

	.user-info button:hover {
		background: rgba(255, 69, 58, 0.2);
		color: var(--color-error);
	}

	.user-info button:active {
		transform: scale(0.95) translateZ(0);
	}

	/* ===== MESSAGES ===== */
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

	.date-divider {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
		contain: layout;
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
		pointer-events: none;
	}

	.message {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
		/* animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; */
		will-change: transform, opacity;
		contain: layout style;
	}

	.message.grouped {
		margin-top: 2px;
		animation: none;
	}

	.message.own {
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
		background: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font: 600 0.75rem var(--font-read);
		color: var(--color-bg-primary);
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

	.message-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: min(75%, 600px);
		contain: layout;
	}

	.message.own .message-content {
		align-items: flex-end;
	}

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

	.message.own .message-row {
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
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		gap: 0.5rem;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.bubble-wrapper:active {
		cursor: grabbing;
	}

	.bubble-meta {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		flex-shrink: 0;
		padding-bottom: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.bubble-wrapper:hover .bubble-meta,
	.bubble-wrapper:active .bubble-meta {
		opacity: 1;
	}

	/* When the meta should always be visible (e.g. last message), override hover rule */
	.bubble-meta.always-visible {
		opacity: 1;
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
		background: var(--gradient-primary);
		border: none;
		box-shadow: var(--shadow-md);
		text-shadow: 0 0.5px 0.5px rgba(0, 0, 0, 0.1);
	}

	.bubble.own:hover {
		background: var(--gradient-primary-hover);
		box-shadow: 0 2px 12px rgba(10, 132, 255, 0.4);
	}

	.bubble.pending {
		background: linear-gradient(135deg, rgba(10, 132, 255, 0.6) 0%, rgba(0, 102, 204, 0.6) 100%);
		border: 1px solid rgba(255, 255, 255, 0.3);
		opacity: 1;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.bubble.failed {
		border-color: rgba(255, 100, 100, 0.5);
		background: rgba(255, 100, 100, 0.15);
	}

	.time {
		font: 0.7rem var(--font-read);
		color: rgba(255, 255, 255, 0.4);
		white-space: nowrap;
		flex-shrink: 0;
		user-select: none;
	}

	/* Status indicators */
	.status {
		font: 0.7rem/1 var(--font-ui);
		user-select: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.status.pending {
		animation: spin 1s linear infinite;
		color: #0a84ff;
		font-weight: bold;
	}

	.status.sent {
		color: rgba(255, 255, 255, 0.6);
	}

	.status.failed {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: #ff453a;
		transition: color 0.2s;
		font-size: 0.7rem;
	}

	.status.failed:hover {
		color: #ff6347;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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
		gap: 0;
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
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: background-color, transform;
		flex-shrink: 0;
		color: #fff;
		padding: 0;
	}

	.action-buttons button:hover:not(:disabled) {
		color: #0071f2;
	}

	.action-buttons .delete-btn:hover:not(:disabled) {
		color: #dc2626;
	}

	.action-buttons button:active:not(:disabled) {
		transform: scale(0.95) translateZ(0);
	}

	.action-buttons button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-buttons svg {
		width: 16px;
		height: 16px;
	}

	/* ===== SCROLL BUTTON ===== */
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
		color: var(--color-text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-base);
		z-index: 20;
		will-change: background-color, color, transform;
	}

	.scroll-bottom:hover {
		background: var(--gradient-primary);
		box-shadow: var(--shadow-lg);
	}

	.scroll-bottom:active {
		transform: scale(0.95) translateZ(0);
	}

	.unread-badge {
		position: absolute;
		top: -6px;
		right: -6px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 9px;
		background: var(--gradient-primary);
		color: var(--color-text-primary);
		font: 600 0.7rem var(--font-read);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 6px rgba(10, 132, 255, 0.5), 0 0 0 2px var(--color-bg-primary);
		pointer-events: none;
	}

	.scroll-bottom svg {
		width: 18px;
		height: 18px;
	}

	/* ===== INPUT BAR ===== */
	.input-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.75rem 1rem 1rem;
		background: rgba(10, 10, 10, 0.8);
		backdrop-filter: blur(12px) saturate(180%);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		z-index: 9;
	}

	.input-wrapper {
		flex: 1;
		position: relative;
		display: flex;
		align-items: flex-end;
	}

	.input-bar textarea {
		flex: 1;
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		padding: 0.65rem 0.9rem;
		color: #fff;
		font: 0.95rem/1.4 var(--font-read);
		resize: none;
		min-height: 22px;
		max-height: 120px;
		overflow: hidden;
		transition: all 0.15s;
	}

	.input-bar textarea::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.input-bar textarea:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.15);
	}

	.input-bar textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.char-counter {
		font: 600 0.7rem var(--font-ui);
		color: rgba(255, 255, 255, 0.6);
		background: rgba(0, 0, 0, 0.45);
		padding: 0.15rem 0.5rem;
		border-radius: 8px;
		pointer-events: none;
		user-select: none;
		transition: color 0.2s, opacity 0.15s;
		white-space: nowrap;
	}

	.char-counter.warning {
		color: #ff9500;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.send-area button {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		width: 42px;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.2s;
	}

	.send-area button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.send-area button.active {
		background: rgba(100, 150, 255, 0.3);
		border-color: rgba(100, 150, 255, 0.5);
		color: #fff;
	}

	.send-area button.active:hover {
		background: rgba(100, 150, 255, 0.4);
	}

	.send-area button svg {
		width: 20px;
		height: 20px;
	}

	/* ===== EDIT MODAL ===== */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: var(--color-bg-secondary);
		backdrop-filter: blur(20px) saturate(180%);
		border: 1px solid var(--color-border-light);
		border-radius: 16px;
		padding: 1.5rem;
		max-width: 500px;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		box-shadow: var(--shadow-xl);
		animation: scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateZ(0);
		}
		to {
			opacity: 1;
			transform: scale(1) translateZ(0);
		}
	}

	.modal h4 {
		font-size: 18px;
		font-weight: 600;
		font-family: var(--font-ui, sans-serif);
		color: var(--color-text-primary);
		margin: 0;
	}

	.modal textarea {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid var(--color-border-light);
		border-radius: 12px;
		padding: 0.875rem 1rem;
		color: var(--color-text-primary);
		font: 14px/1.4 var(--font-ui, sans-serif);
		resize: vertical;
		min-height: 100px;
		transition: var(--transition-base);
	}

	.modal textarea:focus-visible {
		outline: none;
		border-color: var(--color-primary);
		background: var(--color-glass-hover);
		box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.modal-actions button {
		padding: 0.75rem 1.5rem;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 500;
		font-family: var(--font-ui, sans-serif);
		cursor: pointer;
		transition: var(--transition-base);
		will-change: transform, box-shadow;
	}

	.modal-actions .cancel {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid var(--color-border-light);
		color: rgba(255, 255, 255, 0.85);
	}

	.modal-actions .cancel:hover {
		background: var(--color-glass-hover);
		border-color: var(--color-border-lightest);
	}

	.modal-actions .save {
		background: var(--gradient-primary);
		border: none;
		color: var(--color-text-primary);
		box-shadow: var(--shadow-md);
	}

	.modal-actions .save:hover {
		box-shadow: var(--shadow-lg);
		transform: translateY(-1px) translateZ(0);
	}

	.modal-actions .save:active {
		transform: scale(0.95) translateZ(0);
	}

	.modal-actions .save:hover:not(:disabled) {
		background: rgba(100, 150, 255, 0.4);
	}

	.modal-actions .save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ===== MOBILE RESPONSIVE ===== */
	@media (max-width: 768px) {
		/* Header adjustments */
		header {
			padding: 0.6rem 0.75rem;
			height: 48px;
		}

		header h3 {
			font-size: 0.95rem;
		}

		.user-info span {
			font-size: 0.85rem;
		}

		/* Auth card adjustments */
		.auth-card {
			padding: 2rem 1.5rem;
		}

		.auth-card h2 {
			font-size: 1.75rem;
		}

		/* Message list adjustments */
		.message-content {
			max-width: 80%;
		}

		/* Scroll button adjustment */
		.scroll-bottom {
			bottom: calc(48px + 1rem + 0.75rem);
			right: 1rem;
		}

		/* Input bar adjustments - CRITICAL: 16px minimum to prevent iOS zoom */
		.input-bar {
			padding: 0.6rem 0.75rem 0.75rem;
		}

		.input-bar textarea {
			font-size: 16px;
		}

		.send-area button {
			font-size: 16px;
		}

		/* Safe area insets for notched devices */
		@supports (padding: max(0px)) {
			.input-bar {
				padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
				padding-left: max(0.75rem, env(safe-area-inset-left));
				padding-right: max(0.75rem, env(safe-area-inset-right));
			}

			header {
				padding-top: max(0.6rem, env(safe-area-inset-top));
			}
		}

		/* Modal adjustments for smaller screens */
		.modal {
			max-width: calc(100% - 2rem);
			padding: 1.25rem;
		}

		.modal-actions {
			flex-direction: column;
		}

		.modal-actions button {
			width: 100%;
		}
	}

	/* ===== REDUCED MOTION ===== */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>