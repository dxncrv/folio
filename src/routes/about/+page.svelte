<script lang="ts">
</script>

<svelte:head>
	<title>About</title>
</svelte:head>

<main>
	<div class="container">
		<h1>Aashay Mehta</h1>
		<p>UX Engineer</p>
	</div>
	<div class="letter">
		<p>
			From 2015 to 2020, I spent 4 years freelancing for architects, sculptors and small business
			owners, building on my skills like visual design, spatial design, problem solving, and design
			thinking.<br /><br />

			In 2021, I graduated with a Master of Digital Media from the Centre for Digital Media in
			Vancouver, and since then, I have been focused on building software products that are
			user-centric and backed by the science of human behavior.
		</p>
	</div>
</main>

<style>
	main {
		display: flex;
		margin: auto;
	}
	h1 {
		font-family: var(--font-ui);
		color: var(--accent);
		font-size: 2.5rem;
	}
	.letter {
		width: 30%;
		line-height: 2;
		background: var(--bg);
		border-radius: 1rem;
	}
	.letter > p {
		font-size: medium;
	}

	p {
		font-family: var(--font-read);
		font-size: 1.2rem;
		padding: 1rem;
	}
</style>
