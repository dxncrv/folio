<script lang="ts">
    import Card from '$lib/components/project-card.svelte';
    import { Facets, Projects } from '$lib/store.svelte';
    import { getCanonicalUrl } from '$lib/seo';
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

    // Mobile infinite scroll state
    let mobileVisibleCount = $state(3);
    let isMobile = $state(false);
    let ticking = $state(false);

    // Check if mobile on mount
    $effect(() => {
        if (typeof window !== 'undefined') {
            const checkMobile = () => {
                isMobile = window.innerWidth <= 768;
                // Reset count when switching to desktop
                if (!isMobile) {
                    mobileVisibleCount = selectedProjects.length;
                }
            };
            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }
    });

    function handleScroll() {
        if (!isMobile || !ticking) {
            requestAnimationFrame(() => {
                if (isMobile && mobileVisibleCount < selectedProjects.length) {
                    const scrollHeight = document.documentElement.scrollHeight;
                    const scrollTop = window.scrollY;
                    const clientHeight = window.innerHeight;
                    
                    // Load more when user scrolls past 80% of the page
                    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
                        mobileVisibleCount = Math.min(mobileVisibleCount + 3, selectedProjects.length);
                    }
                }
                ticking = false;
            });
            ticking = true;
        }
    }

    // Displayed projects based on device
    const displayedProjects = $derived(
        isMobile 
            ? selectedProjects.slice(0, mobileVisibleCount)
            : selectedProjects.slice(Projects.range.min, Projects.range.max)
    );
</script>

<svelte:window onscroll={handleScroll} />

<svelte:head>
	<title>Projects - Aashay Mehta</title>
	<meta name="description" content="Portfolio of design and development projects. Explore case studies showcasing interaction design, full-stack development, and creative problem solving." />
	<link rel="canonical" href={getCanonicalUrl('/projects')} />
	<meta property="og:title" content="Projects - Aashay Mehta" />
	<meta property="og:description" content="Portfolio of design and development projects" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={getCanonicalUrl('/projects')} />
	
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
	<div id="view">
		{#each displayedProjects as project, i}
			{#key project.title}
				<div class="card-wrapper" class:fade-in={isMobile && i >= 3} style={isMobile ? `--delay: ${(i % 3) * 0.1}s` : ''}>
					<Card {project} />
				</div>
			{/key}
		{/each}
	</div>
	{#if hasProjects && !isMobile}
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
        justify-content: center;
        /* border: 1px solid var(--bg); */
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
    .card-wrapper {
        width: 100%;
    }
    .btn-wrapper {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin: 0 0 2rem;
    }
    @media (max-width: 768px) {
        main {
            margin: 1.15rem;
            width: 100%;
            border-left: none;
            border-right: none;
        }
        #view {
            padding: 1rem;
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }
        .card-wrapper.fade-in {
            animation: fadeIn 0.4s ease-out forwards;
            animation-delay: var(--delay, 0s);
            opacity: 0;
        }
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .btn-wrapper {
            margin-bottom: 1rem;
        }
    }
</style>
