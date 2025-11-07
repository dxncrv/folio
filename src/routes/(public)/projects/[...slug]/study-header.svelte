<script lang=ts>
    import { slugify } from '$lib/formatting';
    import { goto } from '$app/navigation';
    import { Projects } from '$lib/store.svelte';
    import { page } from '$app/state';
    import type { Project } from '$lib/types';

    // Context7: /sveltejs/kit - accept server data as props for SSR
    let { project: serverProject, projects: serverProjects } = $props<{
        project: Project | undefined;
        projects: Project[];
    }>();

    // Use store data if available (client-side), otherwise fallback to server props for SSR
    const allProjects = $derived(Projects.all.length > 0 ? Projects.selected : serverProjects);
    const project = $derived(
        Projects.all.length > 0 
            ? Projects.selected.find((p: any) => slugify(p.title) === page.params.slug)
            : serverProject
    );
	const projectIndex = $derived(allProjects.findIndex((p: any) => slugify(p.title) === page.params.slug));
</script>

<header>
    <button
        class="primary"
        disabled={projectIndex <= 0}
        onclick={() => goto(`/projects/${slugify(allProjects[projectIndex - 1].title)}`)}
        aria-label="Previous Project"
    >
        Prev
    </button>
    <a href="/projects" class="back">
        <iconify-icon icon="mdi:arrow-up-left" width="24" height="24"></iconify-icon>
        <h1>
            <span style="color: var(--accent)">{project?.title}</span>
        </h1>
    </a>
    <button
        class="primary"
        disabled={projectIndex >= allProjects.length - 1}
        onclick={() => goto(`/projects/${slugify(allProjects[projectIndex + 1].title)}`)}
        aria-label="Next Project"
    >
        Next
    </button>
</header>

<style>
    header {
		display: flex;
		padding: 1rem;
		gap: 1rem;
		justify-content: space-between;
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
    @media (max-width: 768px) {
		h1 {
			font-size: 1.5rem;
		}
    }
</style>