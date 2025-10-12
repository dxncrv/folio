<script lang="ts">
	import { page } from '$app/state';
	import { slugify } from '$lib/formatting';
	import { Projects, CaseStudies } from '$lib/store.svelte';
	import StudyHeader from './studyHeader.svelte';
	import StudyBody from './studyBody.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const slug = $derived(page.params.slug);
	const project = $derived(Projects.selected.find((p) => slugify(p.title) === slug));

	// Initialize stores with server-loaded data immediately for SSR hydration
	$effect(() => {
		if (data.projects && data.projects.length > 0) {
			Projects.initialize(data.projects);
		}
		if (data.caseStudy) {
			CaseStudies.initializeOne(data.caseStudy);
		}
	});
</script>

<svelte:head>
	<title>{project?.title || 'Project'} - Case Study</title>
	{#if project}
		<meta name="description" content={project.desc || `Case study for ${project.title}`} />
		<meta property="og:title" content={`${project.title} - Case Study`} />
		<meta property="og:description" content={project.desc || `Case study for ${project.title}`} />
		{#if project.image}
			<meta property="og:image" content={project.image} />
		{/if}
	{/if}
</svelte:head>

<main>
	<StudyHeader />
	<StudyBody />
</main>

<style>
	main {
		border: 1px solid var(--font-dim);
		border-radius: 1rem;
		margin: 2.5rem auto;
		max-width: 900px;
		background: var(--bg);
	}
	@media (max-width: 768px) {
		main {
			margin: 1rem;
		}
	}
</style>
