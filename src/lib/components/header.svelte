<style>
	nav {
		display: flex;
		flex-wrap: wrap-reverse;
		width: 100%;
		justify-content: space-around;
		margin: 1rem;
		z-index: 1000;
	}
	nav > * {
		margin: 0.25rem;
	}
	menu {
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
		color: var(--font-color);
		font-size: 1rem;
		font-family: var(--font-ui);
		padding: 0.35rem 1rem;
		background: var(--bg);
		border: none;
		transition: color 0.3s ease-in-out;
	}
	menu > button:hover {
		cursor: pointer;
		color: var(--contrast);
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
		color: var(--contrast);
	}
	menu > a:active:not(.active) {
		color: var(--accent);
	}

	@media (max-width: 768px) {
		nav {
			gap: 0.25rem;
		}
	}
</style>

<script lang="ts">
	// Importing and utility functions
	import { updateTheme } from '$lib/utils';
	import { Facets } from '$lib/store.svelte';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import Dot from './plugins/Dot.svelte';

	// Initialising the navigation links
	let nav = [
		{ name: 'Home', href: '/' },
		{ name: 'About', href: '/about' },
		{ name: 'Projects', href: '/projects' },
		{ name: 'Contact', href: '/contact' }
	];

	// function to check if the link is active
	function isActive(routeId: string, href: string) {
		return routeId === href || (href !== '/' && routeId.startsWith(href));
	}
</script>
	{#snippet formBtn(action: string, label: string, id: string, icon: string)}
		<button formaction={action} aria-label={label}>
			<iconify-icon id={id} icon={icon} width="28" height="28"></iconify-icon>
		</button>
	{/snippet}

<nav>
	<menu>
		{#each nav as { name, href }}
			<a
				class:active={isActive(page.route.id ?? '', href)}
				{href}
				>{name}
			</a>
			{/each}
			<Dot />
	</menu>
	<menu>
		{#each Facets.facets as { name, bool }}
			<button class:isOn={bool} onclick={() => Facets.toggle(name)}>
				{name}
			</button>
		{/each}
		<form id="theme-toggler" method="post" use:enhance={updateTheme}>
			{@render formBtn('/?/setTheme&theme=light','Toggle Light Theme','light','line-md:lightbulb-twotone')}
			{@render formBtn('/?/setTheme&theme=dark','Toggle Dark Theme','dark','line-md:lightbulb-off-twotone')}
		</form>
	</menu>
</nav>

