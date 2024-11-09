<script lang="ts">
	// Importing the icons and utility functions
	import { Light, Dark } from '$lib/icons';
	import { initDot, moveDot, updateTheme } from '$lib/utils';
	import { Facets } from '$lib/store.svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	// Initialising the navigation links
	let nav = [
		{ name: 'Home', href: '/' },
		{ name: 'About', href: '/about' },
		{ name: 'Projects', href: '/projects' },
		{ name: 'Contact', href: '/contact' }
	];

	onMount(() => {
		initDot();
	});
</script>

<nav>
	<menu>
		{#each nav as { name, href }}
			<a
				class:active={href === $page.route.id}
				{href}
				onclick={(e) => moveDot(e.target as HTMLElement)}
				>{name}
			</a>
			<div class="dot"></div>
		{/each}
	</menu>
	<menu>
		{#each Facets.facets as { name, bool }}
			<button class:isOn={bool} onclick={() => Facets.toggle(name)}>
				{name}
			</button>
		{/each}
	</menu>
	<form id="theme-toggler" method="post" use:enhance={updateTheme}>
		<button formaction="/?/setTheme&theme=light">
			<Light id="light" />
		</button>
		<button formaction="/?/setTheme&theme=dark">
			<Dark id="dark" />
		</button>
	</form>
</nav>

<style>
	nav {
		width: 100%;
		display: flex;
		justify-content: space-around;
		padding: 1rem;
		z-index: 1000;
	}
	menu {
		margin: 0.25rem;
		position: relative;
		display: flex;
		width: fit-content;
		justify-content: space-between;
		border-radius: 0.85rem;
	}
	menu > a {
		text-decoration: none;
		font-family: var(--font-ui);
		color: var(--font-color);
		user-select: none;
		padding: 0.35rem 1rem;
		background: var(--bg);
		transition: color 0.3s ease-in-out;
	}
	menu > button {
		user-select: none;
		color: var(--font-dim);
		font-size: 1rem;
		font-family: var(--font-ui);
		padding: 0.35rem 1rem;
		background: var(--bg);
		border: none;
		transition: color 0.3s ease-in-out;
	}
	menu > button:hover {
		cursor: pointer;
		color: var(--font);
	}
	menu > button.isOn {
		color: var(--accent);
		background: var(--bg);
	}
	menu > button:active {
		color: var(--accent);
	}
	menu > button:disabled {
		color: var(--bg-dim);
	}
	.active {
		color: var(--accent);
	}
	menu > a:first-of-type,
	menu > button:first-of-type {
		border-top-left-radius: 0.75rem;
		border-bottom-left-radius: 0.75rem;
	}
	menu > a:last-of-type,
	menu > button:last-of-type {
		border-top-right-radius: 0.75rem;
		border-bottom-right-radius: 0.75rem;
	}
	menu > a:hover:not(.active) {
		cursor: pointer;
		color: var(--hover-color);
	}
	menu > a:active:not(.active) {
		color: var(--accent);
	}
	.dot {
		position: absolute;
		bottom: 0;
		width: 0.35rem;
		height: 0.2rem;
		translate: -100% 50%;
		border-radius: 50%;
		background: var(--accent);
		opacity: 0;
		transition:
			translate 0.3s,
			opacity 0.3s ease-in-out;
	}
</style>
