<script lang="ts">
	import { page } from '$app/state';
	import { slugify } from '$lib/formatting';
	import { Projects, CaseStudies } from '$lib/store.svelte';
	import { getCanonicalUrl, SITE_URL, generateBreadcrumbSchema } from '$lib/seo';
	import StudyHeader from './study-header.svelte';
	import StudyBody from './study-body.svelte';
	import type { PageData } from './$types';

	/**
	 * Catchall route pattern: [...]slug captures arbitrary path segments
	 * and makes them available as a single slug string via page.params.slug
	 * 
	 * Context7: /llmstxt/svelte_dev_kit_llms_txt - Svelte 5 $derived
	 * automatically recomputes slug when params change, enabling reactive routing
	 * 
	 * TODO Potential improvements:
	 * - Use $derived.by() to memoize project/case study lookups if perf becomes an issue
	 * - Implement proper 404 boundary component when project/caseStudy not found
	 * - Consider adding route state machine for loading/error states
	 * - Add analytics tracking for case study views
	 */
	let { data } = $props<{ data: PageData }>();

	const slug = $derived(page.params.slug || '');
	
	// This ensures the project is available during initial SSR before client hydration
	const project = $derived(
		Projects.all.length > 0 
			? Projects.selected.find((p: any) => slugify(p.title) === slug)
			: data.projects.find((p: any) => slugify(p.title) === slug)
	);

	// Derive case study from server data for SSR, fallback to store
	const caseStudy = $derived(
		CaseStudies.all.length > 0
			? CaseStudies.all.find((cs) => cs.slug === slug)
			: data.caseStudy
	);

	// Initialize stores with server-loaded data for client-side interactivity
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
		<link rel="canonical" href={getCanonicalUrl(`/projects/${slug}`)} />
		<meta property="og:title" content={`${project.title} - Case Study`} />
		<meta property="og:description" content={project.desc || `Case study for ${project.title}`} />
		<meta property="og:type" content="article" />
		<meta property="og:url" content={getCanonicalUrl(`/projects/${slug}`)} />
		{#if project.image}
			<meta property="og:image" content={project.image.startsWith('http') ? project.image : `${SITE_URL}${project.image}`} />
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:image" content={project.image.startsWith('http') ? project.image : `${SITE_URL}${project.image}`} />
		{/if}
		
		<!-- Article Schema -->
		{@html `<script type="application/ld+json">
			{
				"@context": "https://schema.org",
				"@type": "Article",
				"headline": "${project.title}",
				"description": "${project.desc || `Case study for ${project.title}`}",
				"author": {
					"@type": "Person",
					"name": "Aashay Mehta"
				},
				"keywords": "${project.tags.join(', ')}",
				${project.image ? `"image": "${project.image}",` : ''}
				"datePublished": "${project.date || new Date().toISOString()}",
				"articleBody": "${caseStudy?.content?.substring(0, 500).replace(/"/g, '\\"') || ''}"
			}
		</script>`}
		
		<!-- Breadcrumb Schema -->
		{@html `<script type="application/ld+json">${JSON.stringify(generateBreadcrumbSchema([
			{ name: 'Home', url: '/' },
			{ name: 'Projects', url: '/projects' },
			{ name: project.title, url: `/projects/${slug}` }
		]))}</script>`}
	{/if}
</svelte:head>

<main>
	<StudyHeader {project} projects={data.projects} />
	<StudyBody {caseStudy} {slug} />
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
