<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { talkMessages } from './talk-messages.svelte';

	interface Props {
		visible?: boolean;
		messageId?: string | null;
		initialText?: string;
		maxLength?: number;
		onClose?: () => void;
		reducedMotion?: boolean;
	}
	let { visible = $bindable(false), messageId = null, initialText = '', maxLength = 250, onClose, reducedMotion = false }: Props = $props();

	let text = $state('');
	const canSave = $derived(text.trim().length > 0 && text.trim().length <= maxLength);

	// Sync text when props change
	$effect(() => { text = initialText; });

	// Escape key handler
	$effect(() => {
		if (!visible) return;
		const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	});

	function close() {
		visible = false;
		onClose?.();
	}

	async function save() {
		if (!messageId || !canSave) return;
		if (await talkMessages.edit(messageId, text.trim())) close();
	}
</script>

{#if visible}
	<div 
		class="modal-backdrop" 
		onclick={close} 
		onkeydown={(e) => e.key === 'Escape' && close()}
		role="button"
		tabindex="-1"
		aria-label="Close modal"
		transition:fade={{ duration: reducedMotion ? 0 : 200 }}
	>
		<div 
			class="modal" 
			onclick={(e) => e.stopPropagation()} 
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="0"
			aria-modal="true"
			aria-labelledby="modal-title"
			transition:fly={{ y: 20, duration: reducedMotion ? 0 : 300 }}
		>
			<h4 id="modal-title">Edit Message</h4>
			<textarea bind:value={text} rows="3" maxlength={maxLength} aria-label="Edit message text"></textarea>
			<div class="modal-actions">
				<button class="cancel" onclick={close}>Cancel</button>
				<button class="save" onclick={save} disabled={!canSave}>Save</button>
			</div>
		</div>
	</div>
{/if}

<style>
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
	}

	.modal {
		background: rgba(28, 28, 30, 0.98);
		backdrop-filter: blur(20px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		padding: 1.5rem;
		max-width: 500px;
		width: 100%;
	}

	.modal h4 {
		font: 600 1.1rem/1 var(--font-ui);
		color: #fff;
		margin: 0 0 1rem;
	}

	.modal textarea {
		width: 100%;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		padding: 0.75rem;
		color: #fff;
		font: 0.95rem/1.4 var(--font-read);
		resize: vertical;
		min-height: 80px;
	}

	.modal textarea:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.3);
		box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.modal-actions button {
		padding: 0.6rem 1.25rem;
		border-radius: 10px;
		font: 500 0.9rem var(--font-ui);
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.8);
	}

	.cancel:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.save {
		background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
		border: none;
		color: #fff;
		box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
	}

	.save:hover:not(:disabled) {
		box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4);
	}

	.save:active:not(:disabled) { transform: scale(0.98); }
	.save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
