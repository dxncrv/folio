<script lang="ts">
	import Stack from '$lib/components/stack.svelte';
	import Letter from './blocks/letter.svelte';
	import Socials from '$lib/components/socials.svelte';
	import { getCanonicalUrl, DEFAULT_OG_IMAGE, generatePersonSchema, SITE_URL } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let loaded = $state(false);

	const personSchema = generatePersonSchema({
		description: 'User Interaction and Experience Designer, Full-stack Developer, and Human. Solutions Architect with 5+ years of experience building user-centered digital experiences.',
		image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
		knowsAbout: [
			'User Experience Design',
			'Interaction Design',
			'SvelteKit',
			'TypeScript',
			'UI/UX Design',
			'Research',
			'Front-end Development',
			'Back-end Development',
			'Full-Stack Development'
		]
	});
</script>

<svelte:head>
	<title>About - Aashay Mehta</title>
	<meta name="description" content="User Interaction and Experience Designer, Full-stack Developer, and Human. Learn more about my background, skills, and approach to design and development." />
	<link rel="canonical" href={getCanonicalUrl('/about')} />
	<meta property="og:title" content="About - Aashay Mehta" />
	<meta property="og:description" content="User Interaction and Experience Designer, Full-stack Developer, and Human" />
	<meta property="og:image" content={`${getCanonicalUrl('')}${DEFAULT_OG_IMAGE}`} />
	<meta property="og:image:width" content="800" />
	<meta property="og:image:height" content="800" />
	<meta property="og:url" content={getCanonicalUrl('/about')} />
	<meta property="og:type" content="profile" />
	
	<!-- Person Schema for SEO -->
	{@html `<script type="application/ld+json">${JSON.stringify(personSchema)}</script>`}
</svelte:head>

<main>
	<div class="label">
		<div class="img-container" class:shimmer={!loaded}>
			<enhanced:img 
				src="/static/assets/aashay.jpg" 
				alt="Aashay Mehta" 
				onload={() => loaded = true}
				class:loading={!loaded}
			/>
		</div>
		<h1>Aash</h1>
		<p>
			Fullstack <b>Developer</b><br />
			UI/UX <b>Designer</b><br />
		</p>
		<Stack/>
		<p>
			Vancouver, CA<br />
		</p>
		<div class="desktop-only">
			<Socials />
		</div>
	</div>
	<Letter markdownContent={data.markdownContent} />
	<div class="mobile-only">
		<Socials />
	</div>
</main>

<style>
	.img-container {
		height: 10rem;
		width: 10rem;
		border-radius: 2rem;
		overflow: hidden;
	}
	enhanced\:img {
		height: 10rem;
		width: 10rem;
		object-fit: cover;
		border-radius: 2rem;
	}
	main {
		display: flex;
		margin: 2rem auto;
		justify-content: center;
		gap: 5rem;
	}

	h1 {
		font-family: var(--font-ui);
		color: var(--accent);
		font-size: 2.5rem;
	}
	.label {
		margin-top: 2rem;
		height: fit-content;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1rem;
		position: sticky;
		top: 6rem;
	}
	.label p {
		font-size: calc(var(--font-size) * 1.15);
		line-height: calc(var(--line-height) * 1.5);
	}
	.desktop-only {
		display: block;
	}
	.mobile-only {
		display: none;
	}
	@media (max-width: 1024px) {
		main {
			gap: 2rem;
		}
	}
	@media (max-width: 768px) {
		.desktop-only {
			display: none;
		}
		.mobile-only {
			display: block;
		}
		main {
			flex-direction: column;
			gap: 2rem;
		}
		.label {
			margin-top: 2.5rem;
			position: static;
		}
	}
</style>
