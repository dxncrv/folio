<script lang="ts">
	import { Csharp, Python, React, Svelte, Tailwind, Typescript } from '$lib/icons';
</script>

<main>
	<div class="tooltip"><Svelte /><span class="tooltiptext">Svelte</span></div>
	<div class="tooltip"><Typescript /><span class="tooltiptext">TypeScript</span></div>
	<div class="tooltip"><React /><span class="tooltiptext">React</span></div>
	<div class="tooltip"><Tailwind /><span class="tooltiptext">Tailwind</span></div>
	<div class="tooltip"><Csharp /><span class="tooltiptext">Csharp</span></div>
	<div class="tooltip"><Python /><span class="tooltiptext">Python</span></div>
</main>

<style>
	main {
		display: flex;
		gap: 1rem;
		background: var(--bg);
		padding: 1rem;
		border-radius: 0.5rem;
	}

	.tooltip {
		position: relative;
		display: inline-block;
	}

	.tooltip .tooltiptext {
		visibility: hidden;
		width: 120px;
		color: var(--accent);
		font-family: 'Fira Code', monospace;
		text-align: center;
		border-radius: 6px;
		padding: 5px 0;

		/* Position the tooltip */
		position: absolute;
		z-index: 1;
		bottom: 100%;
		left: 50%;
		margin-left: -60px;
	}

	.tooltip:hover .tooltiptext {
		visibility: visible;
	}
</style>
