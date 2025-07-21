<script lang="ts">
	import { page } from '$app/state';
	import { slugify } from '$lib/utils';
	import { Projects } from '$lib/store.svelte';
	import StudyHeader from './studyHeader.svelte';
	import StudyBody from './studyBody.svelte';

	let project = $derived(Projects.selected.find((project) => slugify(project.title) === page.params.slug));
</script>

<svelte:head>
	<title>Study - {project?.title}</title>
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
