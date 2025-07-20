<script lang="ts">
	import Stack from '$lib/components/stack.svelte';
	import Socials from '$lib/components/socials.svelte';
	import Letter from './blocks/letter.svelte';
	import helloMd from './blocks/hello.md?raw';
	import resumeMd from './blocks/resume.md?raw';

	const files = [
		{
			name: 'Hello',
			ext: '.md',
			content: helloMd
		},
		{
			name: 'Resume',
			ext: '.md',
			content: resumeMd
		}
	]
</script>

<svelte:head>
	<title>About</title>
</svelte:head>

<main>
	<div class="label">
		<img src="./assets/aashay.jpg" alt="Aashay Mehta" />
		<h1>Aashay Mehta</h1>
		<p>
			Interface and Experience <b>Designer</b>;<br />
			Full-stack <b>Developer</b>;<br />
			& <b>Human</b>.
		</p>
		<Stack />
		<Socials />
	</div>
	<Letter {files} />
</main>

<style>
	img {
		height: 13rem;
		width: 15rem;
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
