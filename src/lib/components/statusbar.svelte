<script lang="ts">
	import { Facets } from '$lib/store.svelte';
</script>

<div class="statusbar">
	{#if Facets.selected().length > 0}
		<p>
			Showing projects in:
			{#each Facets.selected() as facet, i}
				{#if i === Facets.selected().length - 1 && i !== 0}
					{' and ' + facet}
				{:else if i === 0}
					{facet}
				{:else}
					{facet + ', '}
				{/if}
			{/each}
		</p>
	{/if}
</div>

<style>
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
