<script lang=ts>
    import { deriveSlug } from '$lib';
    import { Projects } from '$lib/store.svelte';
    import { page } from '$app/state';
    import type { Project } from '$lib/types';

    // Context7: /sveltejs/kit - accept server data as props for SSR
    let { project: serverProject, projects: serverProjects } = $props<{
        project: Project | undefined;
        projects: Project[];
    }>();

    // Use store data if available (client-side), otherwise fallback to server props for SSR
    const project = $derived(
        Projects.all.length > 0 
            ? Projects.selected.find((p: Project) => deriveSlug(p) === page.params.slug)
            : serverProject
    );

    let isSticky = $state(false);
    let isMinimized = $state(false);
    let lastScrollY = $state(0);
    let scrollDelta = $state(0);
    let ticking = $state(false);
    let hydrating = $state(true);

    // Threshold to prevent oscillation from Safari rubber-band effect
    const SCROLL_THRESHOLD = 10;

    // Initialize state based on current scroll position on mount
    $effect(() => {
        if (typeof window !== 'undefined') {
            const currentScrollY = window.scrollY;
            isSticky = currentScrollY > 0;
            
            if (currentScrollY > 100) {
                isMinimized = true;
            }
            lastScrollY = currentScrollY;
            hydrating = false;
        }
    });

    function handleScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                
                // Ignore rubber-band overscroll (negative or beyond max)
                if (currentScrollY < 0 || currentScrollY > maxScroll) {
                    ticking = false;
                    return;
                }
                
                // Header becomes sticky when scrolled past initial position
                isSticky = currentScrollY > 0;
                
                // Accumulate scroll delta to smooth out small fluctuations
                scrollDelta += currentScrollY - lastScrollY;
                
                // Only change state if delta exceeds threshold
                if (scrollDelta > SCROLL_THRESHOLD && currentScrollY > 100) {
                    isMinimized = true;
                    scrollDelta = 0;
                } else if (scrollDelta < -SCROLL_THRESHOLD) {
                    isMinimized = false;
                    scrollDelta = 0;
                }
                
                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
</script>

<svelte:window onscroll={handleScroll} />

<div class="header-wrapper" class:hydrating>
    <header class:sticky={isSticky} class:minimized={isMinimized}>
        {#if isMinimized}
            <button class="scroll-top" onclick={scrollToTop} aria-label="Scroll to top">
                <iconify-icon icon="tabler:chevron-compact-up" width="24" height="24"></iconify-icon>
            </button>
        {:else}
            <a href="/projects" class="back">
                <iconify-icon icon="line-md:arrow-left" width="24" height="24"></iconify-icon>
                <h1>
                    <span style="color: var(--accent)">{project?.title}</span>
                </h1>
            </a>
        {/if}
    </header>
</div>

<style>
    .header-wrapper {
        min-height: 4rem;
    }
    .header-wrapper.hydrating {
        visibility: hidden;
    }
    header {
		display: flex;
		padding: 1rem;
		gap: 1rem;
		justify-content: center;
		align-items: center;
        border-bottom: 1px solid var(--font-dim);
	}
	.back {
		display: flex;
		align-items: center;
		color: var(--accent-dim);
		font-size: 1.5rem;
		text-decoration: none;
		gap: 1rem;
	}
	.back:hover {
		color: var(--accent);
	}
	h1 {
		font-family: var(--font-ui);
		color: var(--font);
		font-size: 2rem;
	}
    .scroll-top {
        background: var(--body-bg);
        border: none;
        color: var(--accent);
        cursor: pointer;
        padding: 0.5rem;
        min-width: 40px;
        max-height: 24px;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease;
    }
    .scroll-top:hover {
        color: var(--accent);
    }

    @media (max-width: 768px) {
        .header-wrapper {
            min-height: 0;
            position: sticky;
            top: 0.5rem;
            z-index: 100;
        }
        header {
            background: transparent;
            flex-direction: column;
            position: relative;
            top: 0;
            transition: background 0.3s ease, padding 0.3s ease, margin 0.3s ease, border-radius 0.3s ease;
            width: auto;
        }
        header.sticky {
            border: none;
            background: var(--body-bg);
            border-radius: 0.75rem;
            padding: 0.5rem 1rem;
            margin: 0.5rem;
        }
        header.minimized {
            background: transparent;
            padding: 0.5rem;
            margin: 0.5rem;
        }
        header.sticky h1 {
            transform: scale(0.77);
            transform-origin: left center;
        }
		h1 {
			font-size: 1.5rem;
            transition: transform 0.3s ease;
		}
    }
</style>