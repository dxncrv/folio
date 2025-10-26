<!-- Focused sub-component for authentication UI -->
<script lang="ts">
	import { talkAuth } from './talkAuth.svelte';
	import { talkMessages } from './talkMessages.svelte';

	let inputValue = $state('');

	// $derived for computed UI state
	const canSubmit = $derived(!talkAuth.loading && inputValue.trim().length > 0);

	async function handleSubmit() {
		if (!canSubmit) return;
		const success = await talkAuth.login(inputValue);
		if (success) {
			inputValue = '';
			await talkMessages.fetch();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canSubmit) handleSubmit();
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<div class="auth-icon">💬</div>
		<h2>Talk</h2>
		<p class="subtitle">Enter your name to start chatting</p>
		<input
			type="text"
			bind:value={inputValue}
			onkeydown={handleKeydown}
			placeholder="Your name"
			disabled={talkAuth.loading}
			autocomplete="off"
		/>
		{#if talkAuth.error}
			<div class="error">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
					<path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
				{talkAuth.error}
			</div>
		{/if}
		<button onclick={handleSubmit} disabled={!canSubmit} class:loading={talkAuth.loading}>
			{talkAuth.loading ? 'Joining...' : 'Continue'}
		</button>
	</div>
</div>

<style>
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
</style>
