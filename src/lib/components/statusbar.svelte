<script lang="ts">
	import { Facets, Projects } from '$lib/store.svelte';
</script>

<div class="statusbar">
	{#if Facets.selected().length > 0}
		<p>
			Showing <span class="accent">{Projects.mutated.length}</span> projects in:
			{#each Facets.selected() as facet, i}
				{#if i === Facets.selected().length - 1 && i !== 0}
					{' and '} <span class="accent">{facet}</span>
				{:else if i === 0}
					<span class="accent">{facet}</span>
				{:else}
					<span class="accent">{facet + ', '}</span>
				{/if}
			{/each}
		</p>
	{/if}
</div>

<style>
	.accent {
		font-family: var(--font-ui);
		color: var(--accent);
	}
	.statusbar {
		display: flex;
		justify-content: center;
		top: 0;
		left: 0;
		width: 100%;
		padding: 1rem;
		border-bottom: 1px solid var(--font-dim);
	}
</style>
