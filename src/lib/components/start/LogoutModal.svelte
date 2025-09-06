<script lang="ts">
interface Props {
	show: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

let { show, onCancel, onConfirm }: Props = $props();
</script>

{#if show}
	<div class="modal-backdrop">
		<div class="logout-modal">
			<h3>Confirm Logout</h3>
			<p>Are you sure you want to sign out?</p>
			<div class="modal-actions">
				<button onclick={onCancel}>Cancel</button>
				<button onclick={onConfirm}>Sign Out</button>
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
		z-index: 60;
	}
	.logout-modal {
		background: var(--bg);
		border: 1px solid var(--outline);
		border-radius: 0.5rem;
		padding: 2rem;
		max-width: 300px;
		width: 90%;
		text-align: center;
	}
	.logout-modal h3 {
		margin: 0 0 1rem 0;
		color: var(--contrast);
	}
	.logout-modal p {
		margin: 0 0 1.5rem 0;
		color: var(--font-color);
	}
	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}
	.modal-actions button {
		padding: 0.5rem 1rem;
		border: 1px solid var(--outline);
		border-radius: 0.25rem;
		background: #f0f0f0;
		cursor: pointer;
	}
	.modal-actions button:last-child {
		background: #ff6b6b;
		color: white;
	}
</style>
