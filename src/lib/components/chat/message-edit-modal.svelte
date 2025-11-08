<!-- Extracted edit modal component -->
<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { talkMessages } from './talk-messages.svelte';
	import { motionPrefs } from './motion.svelte';

	interface Props {
		messageId: string | null;
		text: string;
		onClose: () => void;
		onSave: (newText: string) => Promise<void>;
	}

	const { messageId, text, onClose, onSave }: Props = $props();

	let editText = $state(text);

	// Context7: Update editText when text prop changes
	$effect(() => {
		editText = text;
	});

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && e.ctrlKey) {
			saveEdit();
		}
	}

	async function saveEdit() {
		if (!editText.trim()) return;
		await onSave(editText);
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if messageId}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
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
			transition:fly={motionPrefs.transitionParams}
		>
			<div class="modal-header">
				<h3 id="modal-title">Edit Message</h3>
				<button onclick={onClose} class="close-btn" aria-label="Close">
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
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
				<button onclick={onClose} class="modal-btn cancel">Cancel</button>
				<button
					onclick={saveEdit}
					class="modal-btn save"
					disabled={talkMessages.editing || !editText.trim()}
				>
					{talkMessages.editing ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.modal {
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		width: 90%;
		max-width: 500px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h3 {
		font: 700 1.25rem/1 var(--font-ui);
		color: #fff;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #fff;
	}

	.modal-input {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: #fff;
		font: 0.95rem var(--font-mono);
		padding: 0.75rem 1rem;
		resize: vertical;
		max-height: 300px;
		min-height: 120px;
	}

	.modal-input:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.08);
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.modal-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font: 0.95rem var(--font-ui);
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid transparent;
	}

	.modal-btn.cancel {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	.modal-btn.cancel:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.modal-btn.save {
		background: #3b82f6;
		color: #fff;
	}

	.modal-btn.save:hover:not(:disabled) {
		background: #2563eb;
	}

	.modal-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Prevent iOS auto-zoom on input focus */
	@media (max-width: 768px) {
		.modal-input {
			font-size: 16px;
		}

		.modal-btn {
			font-size: 16px;
		}
	}
</style>
