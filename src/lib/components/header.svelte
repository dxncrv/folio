<script lang="ts">
	// Importing and utility functions
	import { Facets } from '$lib/store.svelte';
	import { themeStore } from '$lib/theme.svelte';
	import { page } from '$app/state';
	import { Dot } from '$lib';

	// Initialising the navigation links
	let nav = [
		{ name: 'Home', href: '/' },
		{ name: 'About', href: '/about' },
		{ name: 'Projects', href: '/projects' }
	];

	// function to check if the link is active
	function isActive(routeId: string, href: string) {
		return routeId === href || (href !== '/' && routeId.startsWith(href));
	}

	// Scroll detection for mobile nav
	let isHidden = false;
	let lastScrollY = 0;

	function handleScroll() {
		const currentScrollY = window.scrollY;
		const isScrollingDown = currentScrollY > lastScrollY;

		if (isScrollingDown && currentScrollY > 50) {
			isHidden = true;
		} else {
			isHidden = false;
		}

		lastScrollY = currentScrollY;
	}

</script>

<svelte:window on:scroll={handleScroll} />

	{#snippet themeBtn(theme: 'light' | 'dark', label: string, id: string, icon: string)}
		<button onclick={() => themeStore.set(theme)} aria-label={label}>
			<iconify-icon id={id} icon={icon} width="28" height="28"></iconify-icon>
		</button>
	{/snippet}

<nav class:hidden={isHidden}>
	<menu class="nav-links">
		{#each nav as { name, href }}
			<a
				class:active={isActive(page.url.pathname ?? '', href)}
				{href}
				>{name}
			</a>
			{/each}
			<Dot />
	</menu>
	<menu class="nav-filters">
		{#each Facets.facets as { name, bool }}
		<button class:isOn={bool} onclick={() => Facets.toggle(name)}>
				{name}
			</button>
		{/each}
		<div id="theme-toggler">
			{@render themeBtn('light','Toggle Light Theme','light','line-md:moon-alt-to-sunny-outline-loop-transition')}
			{@render themeBtn('dark','Toggle Dark Theme','dark','line-md:sunny-outline-to-moon-loop-transition')}
		</div>
	</menu>
</nav>

<style>
#starticon {
	color: var(--font-color);
}

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
		position: fixed;
		flex-wrap: wrap;
		bottom: 0;
		margin: 0;
		padding: 0.25rem 0 0.5rem 0;
		background: var(--bg);
		border-top: 1px solid var(--font-dim);
		transition: height 0.3s ease-in-out, opacity 0.3s ease-in-out;
		height: auto;
		opacity: 1;
		box-shadow: 0 -8px 16px hsl(from var(--body-bg) h s l / 0.3);
	}

	nav.hidden {
		height: 0;
		opacity: 0;
		pointer-events: none;
		padding: 0;
		border: none;
	}

	.nav-links a {
		background: var(--body-bg);
	}

	.nav-filters button {
		display: none;
	}
	#theme-toggler {
		position: absolute;
		bottom: 0.25rem;
	}
}
</style>