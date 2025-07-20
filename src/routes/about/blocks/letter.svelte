<script lang="ts">
	import { parseMarkdown } from '$lib/utils';
	
	let { files } = $props();
	let activeTab = $state(0);
</script>

<div class="letter">
    <div class="tabs">
        {#each files as file, i}
            <button
                class="tab"
                class:active={activeTab === i}
                onclick={() => activeTab = i}
            >
                {file.name}
            </button>
        {/each}
    </div>
    {@html parseMarkdown(files[activeTab].content)}
</div>

<style>
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
		color: var(--font-dim);
		cursor: pointer;
		border-radius: 0.5rem 0.5rem 0 0;
		position: relative;
	}

	.tab.active {
		background: var(--bg);
        border-left: 1px solid var(--font-dim);
        border-right: 1px solid var(--font-dim);
        border-top: 1px solid var(--accent);
		color: var(--accent);
		z-index: 1;
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

	@media (max-width: 768px) {
		.letter {
			margin-top: 2.5rem;
			padding: 2rem;
			width: 100%;
			border-left: none;
			border-right: none;
		}
		.tabs {
			top: -2.20rem;
			flex-wrap: wrap;
			gap: 0.25rem;
		}
		.tab {
			padding: 0.5rem 1rem;
			font-size: 0.95rem;
		}
	}
</style>
