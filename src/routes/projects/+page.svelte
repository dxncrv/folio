<script lang="ts">
	import Statusbar from '$lib/components/statusbar.svelte';
	import { Facets, Projects } from '$lib/store.svelte';
	import { Award, Git, YT, Link, CaseStudy } from '$lib/icons';

	function slugify(str: string) {
		return str
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
	}
</script>

<svelte:head>
	<title>Projects</title>
</svelte:head>

<main class:no-projects={Projects.filtered.length === 0}>
	{#if Projects.filtered.length !== 0}
		<Statusbar />
	{/if}
	{#if Projects.filtered.length === 0}
		<p>Z z Z</p>
	{/if}
	<div id="view">
		{#each Projects.inView as { image, title, desc, tech, link, git, yt, awards, tags }}
			{#if tags.some((tag) => Facets.selected().includes(tag))}
				<div class="project">
					<h2>
						{title}
						<div style="color:var(--accent-dim)">
							{#if awards}
								{#each awards as award}
									<a href={award} target="_blank" rel="noopener noreferrer"><Award /></a>
								{/each}
							{/if}
							{#if git}
								<a href={git} target="_blank" rel="noopener noreferrer"><Git /></a>
							{/if}
							{#if yt}
								<a href={yt} target="_blank" rel="noopener noreferrer"><YT /></a>
							{/if}
							{#if link}
								<a href={link} target="_blank" rel="noopener noreferrer"><Link /></a>
							{/if}
							{#if title === 'ALIVE Investigator'}
								<a style="color: var(--font)" href={'projects/' + slugify(title)}><CaseStudy /></a>
							{/if}
						</div>
					</h2>
					<img src={image} alt={title} />
					<p>
						{desc}
					</p>
					<ul>
						{#each tech as t}
							<li>{t}</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/each}
	</div>
	{#if Projects.filtered.length !== 0}
		<div class="btn-wrapper">
			<button
				class="primary"
				onclick={Projects.range.prev}
				disabled={Projects.range.min === 0 || Projects.filtered.length === 0}>Prev</button
			>
			<button
				class="primary"
				onclick={Projects.range.next}
				disabled={Projects.range.max >= Projects.filtered.length}>Next</button
			>
		</div>
	{/if}
</main>

<style>
	main {
		margin: 2rem auto;
		display: flex;
		width: 95%;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--font-dim);
		border-radius: 1rem;
	}
	main.no-projects {
		border: none;
	}
	#view {
		min-height: 50vh;
		width: 100%;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(30rem, 1fr));
		padding: 2rem;
		gap: 2rem;
	}
	.btn-wrapper {
		display: flex;
		justify-content: center;
		margin: 1rem;
		gap: 1rem;
	}

	h2 {
		display: flex;
		justify-content: space-between;
	}
	h2 div {
		display: flex;
		gap: 1rem;
	}

	img {
		width: 100%;
	}
	.project {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem;
		background: var(--bg);
		border: 1px solid var(--outline);
		border-radius: 1rem;
		transition:
			color 0.3s,
			border 0.3s,
			box-shadow 0.3s;
	}
	.project:hover {
		border: 1px solid var(--accent);
		box-shadow: 0 0 0.5rem var(--accent-dim);
	}

	h2 {
		font-size: 1.25rem;
		font-family: var(--font-ui);
		color: var(--white);
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style-type: none;
	}
	li {
		font-family: sans-serif;
		font-size: 0.7rem;
		color: var(--white);
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--accent-dim);
		border-radius: 2rem;
	}
	a {
		display: flex;
		color: var(--accent-dim);
		text-decoration: none;
		transition: color 0.3s;
	}
	a:hover {
		color: var(--accent);
	}
	p {
		font-family: var(--font-read);
		font-size: 1rem;
		line-height: 1.5;
		color: var(--white);
	}

	@media (max-width: 768px) {
		main {
			margin: 1rem;
			width: 100%;
		}
		#view {
			grid-template-columns: 1fr;
			padding: 1rem;
		}
	}
</style>
