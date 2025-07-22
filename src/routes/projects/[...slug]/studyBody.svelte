<script lang="ts">
    import { page } from '$app/state';
    import { parseMarkdown } from '$lib/utils';
    import capsMd from './studies/caps.md?raw';
    import aliveMd from './studies/alive-investigator.md?raw';
    import imitationMd from './studies/the-imitation-game.md?raw';
    import fireMd from './studies/fire-investigation.md?raw';
    import g4cMd from './studies/g4c-game.md?raw';
    import sharinMd from './studies/sharin.md?raw';
    import evokarMd from './studies/evokar.md?raw';

    // HashMap to store markdown files
    // TODO make better lol
    const files: Record<string, string> = {
        'caps-cpca-webapp': capsMd,
        'alive-investigator': aliveMd,
        'the-imitation-game': imitationMd,
        'fire-investigation': fireMd,
        'game-impact-jam-g4c': g4cMd,
        'sharin': sharinMd,
        'evokar': evokarMd
    };

    let markdownContent = $derived(files[page.params.slug] || '');
</script>

<div class="article">
    {#if markdownContent}
        {@html parseMarkdown(markdownContent)}
    {:else}
        <p>📝 - Writing in progress...</p>
    {/if}
</div>

<style>
    :global(.article a) {
        color: rgb(15, 166, 236);
        font-family: var(--font-ui);
        text-decoration: none;
    }
    :global(.article video) {
        width: 100%;
    }
    :global(.article p) {
		font-size: calc(var(--font-size) * 1.15);
		padding: 1rem;
		line-height: calc(var(--line-height) * 1.75);
	}
	.article {
		display: flex;
		flex-direction: column;
	}
    :global(.article h2) {
        border-top: 1px solid var(--font-dim);
        font-family: var(--font-ui);
        color: var(--accent);
        font-size: calc(var(--font-size) * 1.5);
        padding: 1rem;
    }
    :global(.article ul) {
        padding-left: 3rem;
        margin-bottom: 1rem;
    }
    :global(.article li) {
        line-height: calc(var(--line-height) * 1.5);
        font-family: var(--font-read);
        font-size: calc(var(--font-size) * 1.15);
        color: var(--contrast);
    }
	:global(.article img) {
        width: 100%;
	}
    @media (max-width: 768px) {
		:global(.article img) {
			width: 100%;
		}
    }
</style>