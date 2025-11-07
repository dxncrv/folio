<script lang="ts">
	import Socials from '$lib/components/socials.svelte';
	import Contact from '$lib/components/contact.svelte';
</script>
<svelte:head>
	<title>Home - Aashay Mehta</title>
	<meta name="description" content="UX Engineer bridging design and code with psychology-backed precision. 5+ years creating award-winning digital experiences from research to development." />
	<meta property="og:title" content="Aashay Mehta - UX Engineer | Designer & Full-Stack Developer" />
	<meta property="og:description" content="I think like a researcher, design like an architect, and code like an engineer. UX Engineer with 5+ years building user-centered digital experiences." />
</svelte:head>

<main>
	<h1>Solutions Architect</h1>
	<p>with 5+ years of experience in shipping real impact from conception to measurement</p>
	<div class="links">
		<a href="/about">About</a>
		<p>•</p>
		<a href="/projects">Projects</a>
	</div>
	<Socials />
	<Contact initialStatus="Ready" />
</main>

<style>
	.links {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		margin-bottom: 1rem;
	}
	.links a {
		font-family: var(--font-ui);
		font-size: 1.2rem;
		color: var(--accent);
		text-decoration: none;
		transition: color 0.2s;
	}
	h1 {
		user-select: none;
		color: var(--accent);
		font-family: var(--font-ui);
		font-size: 5rem;
	}
	p {
		max-width: 650px;
		font-family: var(--font-ui);
		font-size: 1rem;
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
		p {
			padding: 0 2rem;
			text-align: center;
			line-height: 1.75;
		}
	}
</style>
