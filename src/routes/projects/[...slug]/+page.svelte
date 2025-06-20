<script lang="ts">
	import {slugify} from '$lib/utils';
	import { page } from '$app/stores';
	import { Projects } from '$lib/store.svelte';
	import { goto } from '$app/navigation';
	import { videos } from '$lib/vids';

	let project = $derived(Projects.selected.find((project) => slugify(project.title) === $page.params.slug));
	let projectIndex = $derived(Projects.selected.findIndex((project) => slugify(project.title) === $page.params.slug));
</script>

<svelte:head>
	<title>Study - {project?.title}</title>
</svelte:head>

<main>
	<header>
		<button class="primary" disabled={projectIndex === 0} onclick={() => goto(`/projects/${slugify(Projects.selected[projectIndex - 1].title)}`)}>Prev</button>
			<a href="/projects" class="back">
				<iconify-icon icon="mdi:arrow-up-left" width="24" height="24"></iconify-icon>
				<h1><span style="color: var(--accent)">{project?.title}</span></h1>
			</a>
		<button class="primary" disabled={projectIndex === Projects.selected.length - 1} onclick={() => goto(`/projects/${slugify(Projects.selected[projectIndex + 1].title)}`)}>Next</button>
	</header>
	<div class="article">
		{#if project?.title === 'ALIVE Investigator'}
			<video controls>
				<source type="video/mp4" src={videos.a1mdemo_skyfall} />
				<track kind="captions" srclang="en" label="English" />
			</video>
			<h2>Overview</h2>
			<p>
				<b>Challenges</b>: Our team Skyfall was asked to build a product for iOS and work with
				TestFlight. We were asked to analyze the previous prototype and consider a way forward, and
				we chose to reprogram from scratch. We were also asked to develop a user data metrics
				collection module to store data in an online database. <br /><br /><b>My Roles</b>: Project
				Manager, Scrum Master, 3D & UX Designer. I was mainly responsible for Project management and
				Scrum duties. Although, I also helped out in art, design and implementation wherever
				opportunity presented itself.
			</p>
			<img src="/assets/alive.a1m1.png" alt="Skyfall" />
			<p>
				<b>Goals</b>: (1) making a scalable iOS Application for iPad Minis. (2) Developing the
				backend module for collecting data. (3) And running a usability test round to iterate on
				controls and UI.
			</p>
			<p><b>The Result:</b></p>
			<ul>
				<li>A fully voice acted Prologue for setting the context.</li>
				<li>3 Playable characters with different gender and ethnicity.</li>
				<li>A back-end data collection module.</li>
				<li>
					3 different user groups assigned by the game that gives feedback in different levels.
				</li>
				<li>A detailed storyline with 5 possible conclusions.</li>
				<li>Questing, item descriptions and item processing with computer and microscope.</li>
				<li>
					Submitting evidence reports to Ada Lovelace with a text field that records additional
					comments.
				</li>
				<li>Tested usability of features and iterated upon insights gained.</li>
				<li>
					8 animated NPCs, a fully developed environment, minimap, big map, quest description
					panels, ambient sound, zone names, etc.
				</li>
			</ul>
			<h2>Other Contributions</h2>
			<p>
				Besides facilitating meetings with the clients, weekly scrum management, facilitating
				sprints, UX wireframes, and documentation; I also storyboarded a lot, made 3D assets in
				Blender, and systems in Unity.
			</p>
			<video controls>
				<source type="video/mp4" src={videos.a1m4} />
				<track kind="captions" srclang="en" label="English" />
			</video>
			<p>
				After our first client meeting, to kick off the storyline narrative and get Yes and No, I
				made this prototype of prologue. This was made 2nd week into the project and helped us raise
				questions and answer aspects of this particular piece of the entire project really early on.
			</p>
			<img src="/assets/alive.a1m5.png" alt="Skyfall" />
			<p>
				I made 3 of these characters from scratch and implemented them in Unity, using Mixamo for
				the rig, exporting for Unity, and using standard 3rd person controller for animations. I
				also concepted and modelled the science station below.
			</p>
			<img src="/assets/alive.a1m6.png" alt="Skyfall" />
		{:else}
			<p>📝 - Writing in progress...
			</p>
		{/if}
	</div>
</main>

<style>
	video {
		width: 100%;
	}
	main {
		border: 1px solid var(--font-dim);
		border-radius: 1rem;
		margin: 1rem auto;
		max-width: 900px;
		background: var(--bg);
	}
	header {
		display: flex;
		padding: 1rem;
		gap: 1rem;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--font-dim);
	}
	.back {
		display: flex;
		align-items: center;
		color: var(--accent-dim);
		font-size: 1.5rem;
		text-decoration: none;
		gap: 1rem;
	}
	.back:hover {
		color: var(--accent);
	}
	h1 {
		font-family: var(--font-ui);
		color: var(--font);
		font-size: 2rem;
	}
	p {
		font-size: calc(var(--font-size) * 1.15);
		padding: 1rem;
		line-height: calc(var(--line-height) * 2);
	}
	.article {
		display: flex;
		flex-direction: column;
	}
	.article h2 {
		border-top: 1px solid var(--font-dim);
		font-family: var(--font-ui);
		color: var(--accent);
		font-size: calc(var(--font-size) * 1.5);
		padding: 1rem;
	}
	.article ul {
		padding-left: 3rem;
		margin-bottom: 1rem;
	}
	.article li {
		line-height: calc(var(--line-height) * 1.5);
		font-family: var(--font-read);
		font-size: calc(var(--font-size) * 1.15);
		color: var(--contrast);
	}
	.article img {
		border-radius: 1rem;
	}

	@media (max-width: 768px) {
		.article img {
			width: 100%;
		}
		main {
			margin: 1rem;
		}
		h1 {
			font-size: 1.5rem;
		}
	}
</style>
