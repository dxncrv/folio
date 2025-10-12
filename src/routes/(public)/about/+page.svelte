<script lang="ts">
	import Stack from '$lib/components/stack.svelte';
	import Letter from './blocks/letter.svelte';
	import Contact from '$lib/components/contact.svelte';
	import Socials from '$lib/components/socials.svelte';
</script>

<svelte:head>
	<title>About - Aashay Mehta</title>
	<meta name="description" content="Interaction and Experience Designer, Full-stack Developer, and Human. Learn more about my background, skills, and approach to design and development." />
	<meta property="og:title" content="About - Aashay Mehta" />
	<meta property="og:description" content="Interaction and Experience Designer, Full-stack Developer, and Human" />
</svelte:head>

<main>
	<div class="label">
		<enhanced:img src="/static/assets/aashay.jpg" alt="Aashay Mehta" />
		<h1>Aashay Mehta</h1>
		<p>
			Interaction and Experience <b>Designer</b>;<br />
			Full-stack <b>Developer</b>;<br />
			& <b>Human</b>.
		</p>
		<Stack/>
		<Contact initialStatus="Ready" />
		<Socials />
	</div>
	<Letter/>
</main>

<style>
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
	}
	.label p {
		font-size: calc(var(--font-size) * 1.15);
		line-height: calc(var(--line-height) * 1.5);
	}
	@media (max-width: 1024px) {
		main {
			gap: 2rem;
		}
	}
	@media (max-width: 768px) {
		main {
			flex-direction: column;
			gap: 2rem;
		}
		.label {
			margin-top: 0;
		}
	}
</style>
