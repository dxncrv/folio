<script lang="ts">
	import Stack from '$lib/components/stack.svelte';
</script>

<svelte:head>
	<title>About</title>
</svelte:head>

<main>
	<div class="label">
		<img src="./assets/aashay.png" alt="Aashay Mehta" />
		<h1>Aashay Mehta</h1>
		<p>
			Interface and Experience <b>Designer</b>;<br /> Web, App and Games <b>Developer</b>;<br />&
			<b>Human</b>.
		</p>
		<Stack />
	</div>
	<div class="letter">
		<p>
			I spent the years 2015 to 2020 freelancing for architects, artists and small
			business owners. These experiences made me build skills like visual design, spatial design, problem
			solving, and design thinking.
		</p>
		<p>
			Since 2021, after becoming a Master in Digital Media, I have been building software
			products that are user-centric, backed by cognitive and behavioral science, engaging and
			easy to use.
		</p>
		<p>
			These days, I aspire to put these skills and subject expertise to use in building digital
			products that flux into a real and positive influence on the world. <a href="/projects"
				>See my projects?</a
			>
		</p>
	</div>
</main>

<style>
	img {
		width: 15rem;
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
	.letter {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 4rem;
		width: 40%;
		background: var(--bg);
		border-radius: 1rem;
		border: 1px solid var(--font-dim);
	}
	.letter p {
		line-height: calc(var(--line-height) * 2);
	}
	a {
		color: var(--accent-dim);
		transition: color 0.5s;
	}
	a:hover {
		color: var(--accent);
	}

	@media (max-width: 768px) {
		main {
			flex-direction: column;
			gap: 2rem;
		}
		.label {
			margin-top: 0;
		}
		.letter {
			width: 100%;
			border-left: none;
			border-right: none;
		}
	}
</style>
