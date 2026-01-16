<script lang="ts">
	import Socials from '$lib/components/socials.svelte';
	import { getCanonicalUrl, DEFAULT_OG_IMAGE } from '$lib/seo';
</script>
<svelte:head>
	<title>Home - Aashay Mehta</title>
	<meta name="description" content="UX Engineer bridging design and code with psychology-backed precision. 5+ years creating award-winning digital experiences from research to development." />
	<link rel="canonical" href={getCanonicalUrl('/')} />
	<meta property="og:title" content="Aashay Mehta - UX Engineer | Designer & Full-Stack Developer" />
	<meta property="og:description" content="I think like a researcher, design like an architect, and code like an engineer. UX Engineer with 5+ years building user-centered digital experiences." />
	<meta property="og:image" content={`${getCanonicalUrl('')}${DEFAULT_OG_IMAGE}`} />
	<meta property="og:image:width" content="800" />
	<meta property="og:image:height" content="800" />
	<meta property="og:url" content={getCanonicalUrl('/')} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={`${getCanonicalUrl('')}${DEFAULT_OG_IMAGE}`} />
</svelte:head>

<main>
	<!-- <p>I make webs</p> -->
	<h1>Aash</h1>
	<Socials />
</main>

<style>
	h1 {
		user-select: none;
		color: var(--accent);
		font-family: var(--font-ui);
		font-size: 5rem;
	}
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		main {
			gap: 2rem;
		}
		h1 {
			line-height: 1;
			font-size: 4rem;
			text-wrap: wrap;
			text-align: center;
		}
	}
</style>
