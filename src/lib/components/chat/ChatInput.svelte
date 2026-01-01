<script lang="ts">
	import { fade } from 'svelte/transition';
	import { tick } from 'svelte';
	import { talkAuth } from './talk-auth.svelte';
	import { talkMessages } from './talk-messages.svelte';

	interface Props {
		maxLength?: number;
		onSent?: () => void;
	}
	let { maxLength = 250, onSent }: Props = $props();

	let text = $state('');
	let textarea: HTMLTextAreaElement | undefined = $state();
	let timer = $state(0); // 0 = off, 5-60 in 5s increments

	// Derived
	const len = $derived(text.length);
	const canSend = $derived(!talkMessages.sending && text.trim().length > 0 && len <= maxLength);
	const remaining = $derived(maxLength - len);
	const showCounter = $derived(len > maxLength * 0.8);
	const isWarning = $derived(remaining < 100);

	async function send() {
		if (!canSend) return;
		const msg = text.trim();
		const expiresIn = timer > 0 ? timer : undefined;
		text = '';
		const ok = await talkMessages.send(msg, talkAuth.username, expiresIn);
		if (!ok) text = msg;
		await tick();
		textarea?.focus();
		onSent?.();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !talkMessages.sending) {
			e.preventDefault();
			send();
		}
	}

	function cycleTimer() {
		timer = timer === 0 ? 5 : timer >= 60 ? 0 : timer + 5;
	}
</script>

<div class="input-bar">
	<div class="input-wrapper">
		<textarea
			bind:this={textarea}
			bind:value={text}
			{onkeydown}
			placeholder="Message"
			disabled={talkMessages.sending}
			maxlength={maxLength}
			rows="1"
			aria-label="Message input"
			style="field-sizing: content"
		></textarea>
	</div>
	<div class="send-area">
		<button 
			class="timer-dial" 
			class:active={timer > 0}
			onclick={cycleTimer}
			title={timer > 0 ? `Disappearing: ${timer}s` : 'Disappearing message'}
			aria-label={timer > 0 ? `Disappearing in ${timer}s` : 'Disappearing timer'}
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</svg>
			{#if timer > 0}
				<span class="timer-value" transition:fade={{ duration: 150 }}>{timer}s</span>
			{/if}
		</button>
		<button class="send-btn" onclick={send} disabled={!canSend} class:active={canSend} aria-label="Send" title="Send">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2 10h16m0 0l-7-7m7 7l-7 7" />
			</svg>
		</button>
		{#if showCounter}
			<span class="char-counter" class:warning={isWarning} transition:fade={{ duration: 150 }}>
				{remaining}
			</span>
		{/if}
	</div>
</div>

<style>
	.input-bar {
		position: relative;
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
		display: flex;
		align-items: flex-end;
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
		transition: all 0.15s;
	}

	textarea::placeholder { color: rgba(255, 255, 255, 0.4); }
	textarea:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.4);
		background: rgba(255, 255, 255, 0.15);
	}
	textarea:disabled { opacity: 0.5; cursor: not-allowed; }

	.send-area {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}

	.timer-dial, .send-btn {
		position: relative;
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 50%;
		width: 42px;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
		color: rgba(255, 255, 255, 0.7);
		flex-shrink: 0;
	}

	.timer-dial:hover, .send-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.35);
		color: #fff;
		transform: scale(1.05);
	}

	.timer-dial.active, .send-btn.active {
		background: #0a84ff;
		border-color: #0a84ff;
		color: #fff;
		box-shadow: 0 2px 8px rgba(10, 132, 255, 0.4);
	}

	.timer-dial.active:hover, .send-btn.active:hover:not(:disabled) {
		background: #0071f2;
		box-shadow: 0 2px 12px rgba(10, 132, 255, 0.5);
	}

	.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.timer-value {
		position: absolute;
		bottom: -8px;
		right: -4px;
		background: #0a84ff;
		color: #fff;
		font: 600 0.65rem var(--font-ui);
		padding: 0.1rem 0.35rem;
		border-radius: 8px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		pointer-events: none;
	}

	.char-counter {
		font: 600 0.7rem var(--font-ui);
		color: rgba(255, 255, 255, 0.6);
		background: rgba(0, 0, 0, 0.45);
		padding: 0.15rem 0.5rem;
		border-radius: 8px;
		pointer-events: none;
		user-select: none;
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
</style>
