<script lang="ts">
import Socials from '$lib/components/socials.svelte';
</script>
<svelte:head>
	<title>Home</title>
</svelte:head>

<main>
	<h1>I solve questions</h1>
	<p>by analyzing, fragmenting, hypothesizing, prototyping, value testing, and iterating 🔁</p>
	<div class="links">
		<a href="/about">who</a>
		<p>•</p>
		<a href="/projects">what</a>
	</div>
	<Socials />
</main>

<style>
	.links {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		margin-bottom: 2rem;
	}
	.links a {
		font-family: var(--font-ui);
		font-size: 1.2rem;
		color: var(--accent);
		text-decoration: none;
		transition: color 0.2s;
	}
	h1 {
		user-select: none;
		color: var(--accent);
		font-family: var(--font-ui);
		font-size: 5rem;
	}
	p {
		max-width: 650px;
		font-family: var(--font-ui);
		font-size: 1rem;
	}
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	@media (max-width: 768px) {
		main {
			gap: 2rem;
		}
		h1 {
			line-height: 1;
			font-size: 4rem;
			text-wrap: wrap;
			text-align: center;
		}
		p {
			padding: 0 2rem;
			text-align: center;
			line-height: 1.75;
		}
	}
</style>
