<!-- Input with character counter and auto-scroll -->
<script lang="ts">
	import { talkMessages } from './talkMessages.svelte';

	interface Props {
		onMessageSent?: () => void;
	}

	const { onMessageSent }: Props = $props();

	let messageText = $state('');
	let textarea: HTMLTextAreaElement | undefined = $state();

	// Constants and derived state
	const MAX_LENGTH = 250;
	const canSend = $derived(!talkMessages.sending && messageText.trim().length > 0);
	const remainingChars = $derived(MAX_LENGTH - messageText.length);
	const showCounter = $derived(messageText.length > MAX_LENGTH * 0.8); // Show at 80% threshold
	const isWarning = $derived(remainingChars < 100);

	// $effect to focus textarea when needed
	$effect(() => {
		if (textarea) textarea.focus();
	});

	async function send() {
		if (!canSend) return;
		const text = messageText.trim();
		messageText = '';
		if (textarea) textarea.style.height = 'auto';

		const success = await talkMessages.send(text);
		if (success) {
			// Notify parent to scroll after sending
			if (onMessageSent) onMessageSent();
		} else {
			messageText = text; // Restore on error
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !talkMessages.sending) {
			e.preventDefault();
			send();
		}
	}

	function handleInput() {
		if (textarea) {
			textarea.style.height = 'auto';
			textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
		}
	}
</script>

<div class="input-bar">
	<div class="input-wrapper">
		<textarea
			bind:this={textarea}
			bind:value={messageText}
			onkeydown={handleKeydown}
			oninput={handleInput}
			placeholder="Message"
			disabled={talkMessages.sending}
			maxlength={MAX_LENGTH}
			rows="1"
			aria-label="Message input"
		></textarea>
	</div>
	<!-- send-area stacks the optional char counter above the send button -->
	<div class="send-area">
		{#if showCounter}
			<span class="char-counter" class:warning={isWarning} aria-live="polite">
				{remainingChars}
			</span>
		{/if}
        
	<button onclick={send} disabled={!canSend} class:active={canSend} aria-label="Send">
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M2 10h16m0 0l-7-7m7 7l-7 7" />
		</svg>
	</button>
	</div>
</div>

<style>
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
		-webkit-user-select: none;
		user-select: none;
	}

	.input-wrapper {
		flex: 1;
		position: relative;
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

	/* Character counter */
	.send-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		flex-shrink: 0;
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

	button {
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
		font-feature-settings: 'zero' on;
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	button.active {
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		color: #fff;
		box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
	}

	button.active:hover:not(:disabled) {
		background: linear-gradient(135deg, #0071f2 0%, #005bb5 100%);
		transform: scale(1.05) translateZ(0);
		box-shadow: 0 2px 12px rgba(10, 132, 255, 0.4);
	}

	button.active:active:not(:disabled) {
		transform: scale(0.98) translateZ(0);
	}

	button svg {
		transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		width: 20px;
		height: 20px;
		color: inherit;
	}

	button.active:hover:not(:disabled) svg {
		transform: translateX(2px);
	}

	@media (max-width: 768px) {
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
</style>
