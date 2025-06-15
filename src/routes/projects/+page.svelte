<script lang="ts">
    import Card from '$lib/components/card.svelte';
	import Statusbar from '$lib/components/statusbar.svelte';
	import { Facets, Projects } from '$lib/store.svelte';
</script>

<svelte:head>
	<title>Projects</title>
</svelte:head>

<main class:no-projects={Projects.selected.length === 0}>
    {#if Projects.selected.length !== 0}
        <Statusbar />
    {:else}
        <p>Z z Z</p>
    {/if}
	<div id="view">
		{#each Projects.selected.slice(Projects.range.min, Projects.range.max) as project}
			{#if project.tags.some((tag) => Facets.selected().includes(tag))}
				<Card {project} />
			{/if}
		{/each}
	</div>
	{#if Projects.selected.length !== 0}
		<div class="btn-wrapper">
			<button
				class="primary"
				onclick={Projects.range.prev}
				disabled={Projects.range.min === 0 || Projects.selected.length === 0}>Prev</button
			>
			<button
				class="primary"
				onclick={Projects.range.next}
				disabled={Projects.range.max >= Projects.selected.length}>Next</button
			>
		</div>
	{/if}
</main>

<style>
    main {
        width: 95%;
        margin: 2rem auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        border: 1px solid var(--font-dim);
        border-radius: 1rem;
    }
    main.no-projects {
        border: none;
    }
    main > * {
        padding: 2rem 2rem 0;
    }
    #view {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(0, 25rem));
        gap: 2rem;
        justify-content: center;
        align-items: start;
    }
    .btn-wrapper {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin: 0 0 2rem;
    }
    @media (max-width: 768px) {
        main {
            margin: 1rem;
            width: 100%;
            border-left: none;
            border-right: none;
        }
        main > * {
            padding: 1rem;
        }
        #view {
            grid-template-columns: 1fr;
        }
        .btn-wrapper {
            margin-bottom: 1rem;
        }
    }
</style>
