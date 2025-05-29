<script lang="ts">
	import Statusbar from '$lib/components/statusbar.svelte';
	import { Facets, Projects } from '$lib/store.svelte';

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

<main class:no-projects={Projects.selected.length === 0}>
	{#if Projects.selected.length !== 0}
		<Statusbar />
	{/if}
	{#if Projects.selected.length === 0}
		<p>Z z Z</p>
	{/if}
	<div id="view">
		{#each Projects.selected.slice(Projects.range.min, Projects.range.max) as { image, title, desc, tech, link, git, yt, awards, tags }}
			{#if tags.some((tag) => Facets.selected().includes(tag))}
				<div class="project">
					<h2>
							<a
								class="case-study"
								data-sveltekit-preload-data
								href={'projects/' + slugify(title)}><span class="title">{title}</span>
								 <iconify-icon icon="line-md:text-box-twotone" style="margin-left: 0.5rem;" height=24 width=24></iconify-icon>
							</a>
						<div>
							{#if awards}
								{#each awards as award}
									<a class="icon" href={award} target="_blank" rel="noopener noreferrer" aria-label="Award">
										<iconify-icon icon="tabler:award-filled" width="24" height="24"></iconify-icon>
									</a>
								{/each}
							{/if}
							{#if git}
								<a class="icon" href={git} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
									<iconify-icon icon="line-md:github-twotone" width="24" height="24"></iconify-icon>
								</a>
							{/if}
							{#if yt}
								<a class="icon" href={yt} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
									<iconify-icon icon="line-md:youtube" width="24" height="24"></iconify-icon>
								</a>
							{/if}
							{#if link}
								<a class="icon" href={link} target="_blank" rel="noopener noreferrer" aria-label="Link">
									<iconify-icon icon="line-md:external-link" width="24" height="24"></iconify-icon>
								</a>
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
	{#if Projects.selected.length !== 0}
		<div class="btn-wrapper">
			<button
				class="primary"
				onclick={Projects.range.prev}
				disabled={Projects.range.min === 0 || Projects.selected.length === 0}>Prev</button
			>
			<button
				class="primary"
				onclick={Projects.range.next}
				disabled={Projects.range.max >= Projects.selected.length}>Next</button
			>
		</div>
	{/if}
</main>

<style>
	main {
		width: 95%;
		margin: 2rem auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--font-dim);
		border-radius: 1rem;
	}
	main.no-projects {
		border: none;
	}
	main > * {
		padding: 2rem 2rem 0;
	}
	#view {
		width: fit-content;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}
	.btn-wrapper {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin: 0 0 2rem;
	}

	h2 {
		display: flex;
		justify-content: space-between;
	}
	h2 div {
		display: flex;
		gap: 0.5rem;
	}
	.project p {
		line-height: calc(var(--line-height) * 1.5);
	}
	.title {
		color: var(--contrast);
	} .title:hover {
		color: var(--accent);
		animation: none;
	}

	@keyframes color-oscillate {
		0% {
			color: var(--accent);
		}
		100% {
			color: var(--accent-dim);
		}
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
		max-width: 25rem;
		width: 100%;
		margin: 0 auto;
	}
	.project:hover {
		border: 1px solid var(--accent);
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
		color: var(--contrast);
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--accent-dim);
		border-radius: 2rem;
	}
	a {
		display: flex;
		text-decoration: none;
		transition: color 0.3s;
	}
	a.icon {
		color: var(--accent-dim);
	}
	a.case-study {
		animation: color-oscillate 1.5s alternate infinite;
	}
	a:hover {
		color: var(--accent);
		animation: none;
	}

	@media (max-width: 1440px) {
		#view {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 1024px) {
		#view {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		main {
			margin: 1rem;
			width: 100%;
			border-left: none;
			border-right: none;
		}
		main > * {
			padding: 1rem;
		}
		.project {
			border: 1px solid var(--font-dim);
		}
		.project:hover {
			border: 1px solid var(--outline);
			box-shadow: none;
		}
		#view {
			grid-template-columns: 1fr;
		}
		.btn-wrapper {
			margin-bottom: 1rem;
		}
	}
</style>
