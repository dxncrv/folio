<script lang="ts">
	import type { TalkMessage } from '$lib/types';

	interface Props {
		initialUsername?: string;
		initialMessages?: TalkMessage[];
	}

	const { initialUsername = '', initialMessages = [] }: Props = $props();

	// State (/sveltejs/svelte @5.37)
	let authenticated = $state(false);
	let currentUser = $state(initialUsername);
	let authLoading = $state(false);
	let authError = $state('');
	let messages: TalkMessage[] = $state.raw(initialMessages);
	let messageText = $state('');
	let sending = $state(false);
	let messagesEnd: HTMLDivElement | undefined = $state();
	let textarea: HTMLTextAreaElement | undefined = $state();
	let messagesContainer: HTMLDivElement | undefined = $state();
	let lastScrollTop = $state(0);
	let headerVisible = $state(true);
	let sessionRestored = $state(false);
	let checkingSession = $state(true);

	// Memoized formatters (cache date objects to reduce GC pressure)
	const dateCache = new Map<number, string>();
	const formatTime = (ts: number) => {
		const d = new Date(ts);
		const h = d.getHours() % 12 || 12;
		const m = d.getMinutes().toString().padStart(2, '0');
		return `${h}:${m} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
	};

	const formatDate = (ts: number) => {
		if (dateCache.has(ts)) return dateCache.get(ts)!;
		const d = new Date(ts);
		const today = new Date().toDateString();
		const yesterday = new Date(Date.now() - 864e5).toDateString();
		const ds = d.toDateString();
		const result = ds === today ? 'Today' : ds === yesterday ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		dateCache.set(ts, result);
		return result;
	};

	// Derived state for optimized rendering (/sveltejs/svelte @5.37)
	const isAuthenticated = $derived(authenticated);
	const hasMessages = $derived(messages.length > 0);
	const canSend = $derived(!sending && messageText.trim().length > 0);

	// Inline helper functions (avoid closures)
	const shouldGroup = (i: number) => i > 0 && messages[i].username === messages[i - 1].username && messages[i].timestamp - messages[i - 1].timestamp < 60000;
	const shouldShowDate = (i: number) => i === 0 || new Date(messages[i].timestamp).toDateString() !== new Date(messages[i - 1].timestamp).toDateString();
	const shouldShowTime = (i: number) => i === messages.length - 1 || messages[i + 1].timestamp - messages[i].timestamp > 60000 || messages[i + 1].username !== messages[i].username;

	// Auth handlers
	async function handleLogin() {
		authError = '';
		authLoading = true;
		try {
			const res = await fetch('/api/talk/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ username: currentUser.toLowerCase().trim() })
			});
			const data = await res.json();
			if (!res.ok) {
				authError = data.error || 'Authentication failed';
			} else {
				authenticated = true;
				currentUser = data.username;
				await fetchMessages();
			}
		} catch {
			authError = 'Connection error';
		} finally {
			authLoading = false;
		}
	}

	const handleLogout = async () => {
		try {
			// Clear cookie on server
			await fetch('/api/talk/logout', {
				method: 'POST',
				credentials: 'include'
			});
		} catch (e) {
			console.error('Logout request error:', e);
		}
		// Clear client state
		authenticated = false;
		currentUser = '';
		messages = [];
		messageText = '';
		authError = '';
		dateCache.clear();
		// Reset session flag so session check runs again next time
		sessionRestored = false;
	};

	// Message handlers
	async function fetchMessages() {
		try {
			const res = await fetch('/api/talk');
			if (res.ok) messages = await res.json();
		} catch (e) {
			console.error('Fetch error:', e);
		}
	}

	async function sendMessage() {
		if (!canSend) return;
		sending = true;
		const text = messageText.trim();
		messageText = '';
		if (textarea) textarea.style.height = 'auto';
		try {
			const res = await fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ text })
			});
			if (!res.ok) throw new Error();
			await fetchMessages();
		} catch (e) {
			messageText = text; // restore on error
			console.error('Send error:', e);
		} finally {
			sending = false;
		}
	}

	// Scroll handling - show header on scroll up, hide on scroll down
	let scrollRAF: number;
	function handleScroll() {
		cancelAnimationFrame(scrollRAF);
		scrollRAF = requestAnimationFrame(() => {
			if (!messagesContainer) return;
			const st = messagesContainer.scrollTop;
			headerVisible = st < lastScrollTop || st < 50;
			lastScrollTop = st;
		});
	}

	// Effects with proper cleanup (/sveltejs/svelte @5.37 $effect.pre for autoscroll)
	// Restore session on mount if available (30-day persistence)
	$effect(() => {
		if (sessionRestored) return;
		sessionRestored = true;
		(async () => {
			try {
				const res = await fetch('/api/talk/session', {
					method: 'GET',
					credentials: 'include'
				});
				if (res.ok) {
					const data = await res.json();
					if (data.authenticated && data.username) {
						authenticated = true;
						currentUser = data.username;
						await fetchMessages();
					}
				}
			} catch (e) {
				console.error('Session restore error:', e);
			} finally {
				checkingSession = false;
			}
		})();
	});

	$effect.pre(() => {
		if (!messagesEnd || !messagesContainer) return;
		messages.length;
		if (messagesContainer.offsetHeight + messagesContainer.scrollTop > messagesContainer.scrollHeight - 20) {
			messagesEnd.scrollIntoView({ behavior: 'auto' });
		}
	});

	$effect(() => {
		if (textarea && isAuthenticated) textarea.focus();
	});

	$effect(() => {
		return () => cancelAnimationFrame(scrollRAF);
	});

	// Input handlers
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey && !sending) {
			e.preventDefault();
			sendMessage();
		}
	};

	const handleTextareaInput = () => {
		if (textarea) {
			textarea.style.height = 'auto';
			textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
		}
	};

	const handleAuthKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !authLoading && currentUser.trim()) handleLogin();
	};
</script>

<div class="chat-wrapper">
	{#if checkingSession}
		<div class="auth-container">
			<div class="session-loader">
				<div class="spinner">
					<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
						<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.2" />
						<path d="M12 3c4.97 0 9 4.03 9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="20" stroke-dashoffset="0" />
					</svg>
				</div>
				<p>Checking session...</p>
			</div>
		</div>
	{:else if !authenticated}
		<div class="auth-container">
			<div class="auth-card">
				<div class="auth-icon">💬</div>
				<h2>Talk</h2>
				<p class="subtitle">Enter your name to start chatting</p>
				<input
					type="text"
					bind:value={currentUser}
					onkeydown={handleAuthKeydown}
					placeholder="Your name"
					disabled={authLoading}
					autocomplete="off"
				/>
				{#if authError}
					<div class="error">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
							<path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
						{authError}
					</div>
				{/if}
				<button onclick={handleLogin} disabled={authLoading || !currentUser.trim()} class:loading={authLoading}>
					{authLoading ? 'Joining...' : 'Continue'}
				</button>
			</div>
		</div>
	{:else}
		<div class="chat-container">
			<header class:hidden={!headerVisible}>
				<h3>Talk</h3>
				<div class="user-info">
					<span>{currentUser}</span>
					<button onclick={handleLogout} title="Logout" aria-label="Logout">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
						</svg>
					</button>
				</div>
			</header>

			<div class="messages-container" bind:this={messagesContainer} onscroll={handleScroll}>
				{#if messages.length === 0}
					<div class="empty">
						<div class="empty-icon">💬</div>
						<p>No messages yet</p>
						<span>Start the conversation!</span>
					</div>
				{:else}
					{#each messages as msg, i (msg.id)}
						{#if shouldShowDate(i)}
							<div class="date-sep"><span>{formatDate(msg.timestamp)}</span></div>
						{/if}
						<div class="msg" class:own={msg.username === currentUser} class:grouped={shouldGroup(i)}>
							{#if !shouldGroup(i) && msg.username !== currentUser}
								<div class="avatar">{msg.username.charAt(0).toUpperCase()}</div>
							{:else if msg.username !== currentUser}
								<div class="avatar-spacer"></div>
							{/if}
							<div class="msg-content">
								{#if !shouldGroup(i) && msg.username !== currentUser}
									<span class="username">{msg.username}</span>
								{/if}
								<div class="msg-row">
									<div class="bubble" class:own={msg.username === currentUser}>{msg.text}</div>
									{#if shouldShowTime(i)}
										<span class="time">{formatTime(msg.timestamp)}</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				{/if}
				<div bind:this={messagesEnd}></div>
			</div>

			<div class="input-bar">
				<textarea
					bind:this={textarea}
					bind:value={messageText}
					onkeydown={handleKeydown}
					oninput={handleTextareaInput}
					placeholder="Message"
					disabled={sending}
					rows="1"
				></textarea>
				<button
					onclick={sendMessage}
					disabled={!messageText.trim() || sending}
					class:active={messageText.trim()}
					aria-label="Send"
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M2 10h16m0 0l-7-7m7 7l-7 7"/>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.chat-wrapper {
		display: flex;
		width: 100%;
		height: 100%;
		background: var(--body-bg, #0a0a0a);
		-webkit-user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
		-webkit-text-size-adjust: 100%;
	}

	/* Auth */
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
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #fff;
	}

	.auth-card input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.auth-card input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
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

	.auth-card button {
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		border: none;
		color: #fff;
		font: 600 1rem var(--font-ui);
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4);
		text-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.1);
	}

	.auth-card button:hover:not(:disabled) {
		background: linear-gradient(135deg, #0071f2 0%, #005bb5 100%);
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

	/* Session loader */
	.session-loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
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
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.session-loader p {
		font: 0.9rem var(--font-read);
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		letter-spacing: 0.02em;
	}

	/* Chat */
	.chat-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		position: relative;
		contain: layout;
		overflow: hidden;
	}

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
		will-change: contents;
	}

	.user-info span {
		font: 0.9rem var(--font-read);
		color: rgba(255, 255, 255, 0.9);
		user-select: none;
	}

	.user-info button {
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		will-change: background-color, color;
	}

	.user-info button:hover {
		background: rgba(255, 69, 58, 0.2);
		color: #ff453a;
	}

	.user-info button:active {
		transform: scale(0.95);
		transform: translateZ(0);
	}

	/* Messages */
	.messages-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: calc(52px + 1rem) 1rem 1rem;
		padding-bottom: calc(1rem + 48px);
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

	/* Input */
	.input-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.75rem 1rem 1rem;
		background: rgba(10, 10, 10, 0.8);
		backdrop-filter: blur(12px) saturate(180%);
		-webkit-backdrop-filter: blur(12px) saturate(180%);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
		transform: translateZ(0);
		will-change: contents;
		contain: layout;
		z-index: 9;
		/* Safari fixes */
		-webkit-user-select: none;
		user-select: none;
	}

	textarea {
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
		transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: background-color, border-color;
	}

	textarea::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	textarea:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.input-bar button {
		width: 36px;
		height: 36px;
		min-width: 36px;
		min-height: 36px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.12);
		border: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
		will-change: background-color, color, transform, box-shadow;
		contain: paint;
		font-feature-settings: "zero" on;
	}

	.input-bar button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.input-bar button.active {
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		color: #fff;
		box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
	}

	.input-bar button.active:hover:not(:disabled) {
		background: linear-gradient(135deg, #0071f2 0%, #005bb5 100%);
		transform: scale(1.05) translateZ(0);
		box-shadow: 0 2px 12px rgba(10, 132, 255, 0.4);
	}

	.input-bar button.active:active:not(:disabled) {
		transform: scale(0.98) translateZ(0);
	}

	.input-bar button svg {
		transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		width: 20px;
		height: 20px;
		color: inherit;
	}

	.input-bar button.active:hover:not(:disabled) svg {
		transform: translateX(2px);
	}

	/* Mobile */
	@media (max-width: 768px) {
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

		.msg-content {
			max-width: 80%;
		}

		.input-bar {
			padding: 0.6rem 0.75rem 0.75rem;
		}

		@supports (padding: max(0px)) {
			.input-bar {
				padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
				padding-left: max(0.75rem, env(safe-area-inset-left));
				padding-right: max(0.75rem, env(safe-area-inset-right));
			}
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		* {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
