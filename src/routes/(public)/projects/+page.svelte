<script lang="ts">
    import Card from '$lib/components/project-card.svelte';
	import Statusbar from '$lib/components/statusbar.svelte';
    import { Facets, Projects } from '$lib/store.svelte';
    import type { PageData } from './$types';

    let { data } = $props<{ data: PageData }>();

    // Initialize store with server-loaded data immediately for SSR hydration
    $effect(() => {
        if (data.projects && data.projects.length > 0) {
            Projects.initialize(data.projects);
        }
    });

    // Optimize: Cache Facets.selected() to avoid multiple calls
    const selectedFacets = $derived(Facets.selected());
    
    // Derive display data directly from server data for SSR indexing
    // This ensures content is rendered in initial HTML before hydration
    const projects = $derived(Projects.all.length > 0 ? Projects.selected : data.projects);
    const selectedProjects = $derived(
        projects.filter((project: any) => 
            project.tags.some((tag: string) => selectedFacets.includes(tag))
        )
    );
    // Optimize: Extract length check to avoid recomputation
    const hasProjects = $derived(selectedProjects.length > 0);
</script>

<svelte:head>
	<title>Projects - Aashay Mehta</title>
	<meta name="description" content="Portfolio of design and development projects. Explore case studies showcasing interaction design, full-stack development, and creative problem solving." />
	<meta property="og:title" content="Projects - Aashay Mehta" />
	<meta property="og:description" content="Portfolio of design and development projects" />
	<meta property="og:type" content="website" />
	
	<!-- Context7: /sveltejs/kit - JSON-LD structured data for SEO -->
	{@html `<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			"name": "Projects - Aashay Mehta",
			"description": "Portfolio of design and development projects",
			"author": {
				"@type": "Person",
				"name": "Aashay Mehta"
			},
			"hasPart": ${JSON.stringify(
				data.projects.map((p: any) => ({
					"@type": "CreativeWork",
					"name": p.title,
					"description": p.desc,
					"image": p.image,
					"keywords": p.tags.join(', ')
				}))
			)}
		}
	</script>`}
</svelte:head>

<main class:no-projects={!hasProjects}>
    {#if hasProjects}
        <Statusbar />
    {:else}
        <p>Z z Z</p>
    {/if}
	<div id="view">
		{#each selectedProjects.slice(Projects.range.min, Projects.range.max) as project}
			{#key project.title}
				<Card {project} />
			{/key}
		{/each}
	</div>
	{#if hasProjects}
		<div class="btn-wrapper">
			<button
				class="primary"
				onclick={Projects.range.prev}
				disabled={Projects.range.min === 0}>Prev</button
			>
			<button
				class="primary"
				onclick={Projects.range.next}
				disabled={Projects.range.max >= selectedProjects.length}>Next</button
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
