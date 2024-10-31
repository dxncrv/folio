<script lang="ts">
	import { Csharp, Python, React, Svelte, Tailwind, Typescript } from '$lib/icons';
</script>

<main>
	<Svelte />
	<React />
	<Tailwind />
	<Typescript />
	<Csharp />
	<Python />
</main>

<style>
	main {
		display: flex;
		gap: 1rem;
		background: var(--bg);
		padding: 1rem;
		border-radius: 0.5rem;
	}
</style>
