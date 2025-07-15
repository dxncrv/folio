<script>
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>404 - Page Not Found</title>
</svelte:head>

<div class="error-container">
	<div class="error-content">
		<p class="error-message">
			sorry, the page you are trying to visit probably exists in another universe 🚀
		</p>
		<button class="primary" on:click={() => goto('/')}> Go Home </button>
	</div>
</div>

<style>
	:global(body) {
		background: var(--body-bg);
	}

	.error-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4rem;
		box-sizing: border-box;
	}

	.error-content {
		width: 100%;
		max-width: 800px;
		min-height: 50vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		text-align: center;
		border: 1px solid var(--outline);
		border-radius: 1rem;
		padding: 2rem;
		background: var(--body-bg);
	}

	.error-message {
		font-size: calc(var(--font-size) * 1.2);
		color: var(--accent);
		font-family: var(--font-read);
		line-height: 1.4;
		max-width: 600px;
	}

	@media (max-width: 768px) {
		.error-container {
			padding: 1.5rem;
		}
	}
</style>
