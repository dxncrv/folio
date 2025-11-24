<script lang="ts">
	import helloMd from '../blocks/hello.md?raw';
	import resumeMd from '../blocks/resume.md?raw';
	import pubsMd from '../blocks/pubs.md?raw';
	import { parseMarkdown } from '$lib/markdown';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	interface Props {
		markdownContent: {
			hello: string;
			resume: string;
			pubs: string;
		};
	}

	let { markdownContent }: Props = $props();

	// Use server-loaded content if available, fallback to client imports
	const files = $derived([
		{ name: 'Intro', content: markdownContent.hello || helloMd },
		{ name: 'Resume', content: markdownContent.resume || resumeMd },
		{ name: 'Papers', content: markdownContent.pubs || pubsMd }
	]);

	let activeTab = $state(0);
	let isLoading = $state(!browser);

	const getTabFromHash = (hash: string) => {
		const index = files.findIndex(f => `#${f.name.toLowerCase()}` === hash);
		return index !== -1 ? index : null;
	};
	const updateActiveTab = (newTab: number | null) => {
		if (newTab !== null && newTab !== activeTab) {
			activeTab = newTab;
		}
	};

	const selectTab = (index: number) => {
		if (!isLoading) {
			activeTab = index;
			goto(`#${files[index].name.toLowerCase()}`, { replaceState: true, noScroll: true });
		}
	};

	function setupAccordionBehavior() {
		const accordions = document.querySelectorAll('.accordion');
		
		// Ensure first accordion is open
		if (accordions.length > 0) {
			(accordions[0] as HTMLDetailsElement).open = true;
		}

		accordions.forEach((accordion, index) => {
			accordion.addEventListener('toggle', (e) => {
				const details = e.currentTarget as HTMLDetailsElement;
				
				// If opening an accordion, close all others
				if (details.open) {
					accordions.forEach((other, otherIndex) => {
						if (otherIndex !== index) {
							(other as HTMLDetailsElement).open = false;
						}
					});
				}
			});
		});
	}
	
	$effect(() => {
		if (browser) {
			const hashTab = getTabFromHash(page.url.hash);
			updateActiveTab(hashTab);
			if (isLoading) {
				setTimeout(() => {
					isLoading = false;
				}, 100);
			}
		}
	});

	// re-setup when activeTab changes
	$effect(() => {
		if (browser && !isLoading && activeTab >= 0) {
			// Wait for content to render
			setTimeout(() => {
				setupAccordionBehavior();
			}, 0);
		}
	});
</script>

<div class="letter">
	<!-- Always render tabs for SSR -->
	<div class="tabs">
		{#each files as file, i}
			<button
				class="tab"
				class:active={activeTab === i}
				class:loading={isLoading}
				onclick={() => selectTab(i)}
				disabled={isLoading}
			>
				{file.name}
			</button>
		{/each}
		
		<!-- Loading overlay for progressive enhancement -->
		{#if isLoading}
			<div class="loading-tabs-overlay">
				{#each files as file}
					<div class="tab-skeleton"></div>
				{/each}
			</div>
		{/if}
	</div>
	
	<!-- Always render content for SSR, show loading overlay on top -->
	<div class="content-wrapper">
		{@html parseMarkdown(files[activeTab].content)}
		
		{#if isLoading}
			<div class="content-loading-overlay">
				<div class="loading-shimmer"></div>
				<div class="loading-shimmer"></div>
				<div class="loading-shimmer"></div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Layout */
	.letter {
		margin: 1rem;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 4rem;
		height: fit-content;
		width: 37.5%;
		min-width: 625px;
		background: var(--bg);
		border-radius: 1rem;
		border: 1px solid var(--font-dim);
	}

	/* Tabs */
	.tabs {
		position: absolute;
		top: -2.75rem;
		display: flex;
		gap: 0.5rem;
	}
	.tab {
		background: none;
		border: none;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-family: var(--font-ui);
		color: var(--outline);
		cursor: pointer;
		border-radius: 0.5rem 0.5rem 0 0;
		position: relative;
		transition: color 0.5s;
	}
	.tab:hover:not(.loading) {
		color: var(--accent);
	}
	.tab.loading {
		pointer-events: none;
		opacity: 0;
	}

	.tab.active {
		background: var(--bg);
		border: 1px solid var(--font-dim);
		border-bottom: none;
		color: var(--accent);
		z-index: 1;
	}

	/* Loading States - Overlay approach for progressive enhancement */
	.loading-tabs-overlay {
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		gap: 0.5rem;
		z-index: 10;
	}

	.tab-skeleton {
		width: 80px;
		height: 42px;
		background: var(--font-dim);
		opacity: 0.3;
		border-radius: 0.5rem 0.5rem 0 0;
		animation: pulse 1.5s ease-in-out infinite;
	}

	/* Content wrapper for overlay positioning */
	.content-wrapper {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		position: relative;
		min-height: 200px;
	}

	.content-loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		z-index: 5;
	}

	.loading-shimmer {
		height: 1.5rem;
		background: var(--font-dim);
		opacity: 0.2;
		border-radius: 0.25rem;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.loading-shimmer:nth-child(1) { width: 90%; }
	.loading-shimmer:nth-child(2) { width: 75%; animation-delay: 0.2s; }
	.loading-shimmer:nth-child(3) { width: 85%; animation-delay: 0.4s; }

	@keyframes pulse {
		0%, 100% { opacity: 0.2; }
		50% { opacity: 0.5; }
	}

    :global(.letter h1) {
        font-family: var(--font-ui);
        color: var(--accent);
        font-size: 2.5rem;
    }

    :global(.letter h2) {
        margin-left: 1.5rem;
    }
	:global(.letter img) {
		width: 100%;
		max-width: 12rem;
		height: auto;		
	}
	:global(.letter hr) {
		border: 1px solid var(--font-dim);
		margin: 0;
	}

	:global(.letter ul) {
		margin: 1rem 0;
		padding-left: 2rem;
		background: var(--body-bg);
		border-radius: 0.5rem;
		padding: 1rem 2rem;
	}

	:global(.letter li) {
        list-style:circle;
        font-family: var(--font-read);
		margin: 0.5rem 0;
		color: var(--contrast);
		line-height: calc(var(--line-height) * 1.5);
	}

	:global(.letter h3) {
		color: var(--accent);
		font-size: 1.2rem;
		margin: 1.5rem 0 1rem 1.5rem;
	}

	:global(.letter code) {
		background: var(--bg);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		color: var(--accent);
		font-family: 'Fira Code', Consolas, monospace;
		font-size: 0.8rem;
		border: 1px solid var(--font-dim);
	}

	:global(.letter p) {
		line-height: calc(var(--line-height) * 2);
		height: 100%;
		color: var(--contrast);
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		background: var(--body-bg);
	}

	:global(.letter a) {
		color: var(--accent-dim);
		transition: color 0.5s;
		text-decoration: none;
	}

	:global(.letter a:hover) {
		color: var(--accent);
	}

	/* Blockquote Styles */
	:global(.letter blockquote) {
		padding: 0 1rem;
		border-left: 3px solid var(--font-dim);
		color: var(--contrast);
		font-family: var(--font-read);
		line-height: calc(var(--line-height) * 2);
	}

	:global(.letter blockquote:hover) {
		border-left-color: var(--accent);
	}

	:global(.letter blockquote p) {
		padding: 0;
		margin: 0;
		background: transparent;
	}
	:global(.letter .accordion-content blockquote) {
		margin: 0 1rem;
	}

	/* Accordion Styles */
	:global(.letter .accordion) {
		background: var(--body-bg);
		border-radius: 0.5rem;
		overflow: hidden;
		transition: border-color 0.3s;
	}

	:global(.letter .accordion-title) {
		cursor: pointer;
		list-style: none;
		padding: 0.75rem 1.25rem;
		color: var(--accent);
		font-family: var(--font-ui);
		line-height: calc(var(--line-height) * 2);
		user-select: none;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		position: relative;
	}

	:global(.letter .accordion-title::-webkit-details-marker) {
		display: none;
	}

	:global(.letter .accordion-title::before) {
		content: '➤';
		margin-right: 0.75rem;
		transition: transform 0.3s;
		display: inline-block;
		color: var(--accent);
		font-size: 0.75rem;
	}

	:global(.letter .accordion[open] .accordion-title::before) {
		transform: rotate(90deg);
	}

	:global(.letter .accordion-content) {
		border-top: 3px solid var(--bg);
	}

	:global(.letter .accordion-content > *:first-child) {
		margin-top: 0;
	}

	:global(.letter .accordion-content > blockquote:last-child) {
		margin-bottom: 1rem;
	}

	@media (max-width: 1080px) {
		.letter {
			padding: 2rem;
			width: 45%;
		}
	}

	@media (max-width: 768px) {
		.letter {
			margin: 0;
			margin-top: 2.5rem;
			padding: 2rem;
			width: 100%;
			min-width: unset;
			border-left: none;
			border-right: none;
		}
		.tabs {
			top: -2.15rem;
			flex-wrap: wrap;
			gap: 0.25rem;
		}
		.tab {
			padding: 0.5rem 1rem;
			font-size: 0.95rem;
		}
	}
</style>
