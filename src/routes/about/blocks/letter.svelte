<script lang="ts">
	import helloMd from '../blocks/hello.md?raw';
	import resumeMd from '../blocks/resume.md?raw';
	import { parseMarkdown } from '$lib/utils';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	// File definitions
	const files = [
		{ name: 'Hello', content: helloMd },
		{ name: 'Resume', content: resumeMd }
	];

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
</script>

<div class="letter">
	<div class="tabs">
		{#if isLoading}
			<div class="loading-tabs">
				{#each files as file}
					<div class="tab-skeleton"></div>
				{/each}
			</div>
		{:else}
			{#each files as file, i}
				<button
					class="tab"
					class:active={activeTab === i}
					onclick={() => selectTab(i)}
				>
					{file.name}
				</button>
			{/each}
		{/if}
	</div>
	
	{#if isLoading}
		<div class="content-loading">
			<div class="loading-shimmer"></div>
			<div class="loading-shimmer"></div>
			<div class="loading-shimmer"></div>
		</div>
	{:else}
		{@html parseMarkdown(files[activeTab].content)}
	{/if}
</div>

<style>
	/* Layout */
	.letter {
		margin-top: 1rem;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 4rem;
		height: fit-content;
		width: 35%;
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
	.tab:hover {
		color: var(--accent);
	}

	.tab.active {
		background: var(--bg);
		border: 1px solid var(--font-dim);
		border-bottom: none;
		color: var(--accent);
		z-index: 1;
	}

	/* Loading States */
	.loading-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.tab-skeleton {
		width: 80px;
		height: 42px;
		background: var(--font-dim);
		opacity: 0.3;
		border-radius: 0.5rem 0.5rem 0 0;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.content-loading {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
		font-family: 'Courier New', Consolas, monospace;
		font-size: 0.9em;
		border: 1px solid var(--outline);
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
	@media (max-width: 1080px) {
		.letter {
			padding: 2rem;
			width: 45%;
		}
	}

	@media (max-width: 768px) {
		.letter {
			margin-top: 2.5rem;
			padding: 2rem;
			width: 100%;
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
