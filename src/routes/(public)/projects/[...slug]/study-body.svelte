
<script lang="ts">
    import { parseMarkdown } from '$lib/markdown';

    let { study = '' } = $props<{ study: string }>();
</script>

<div class="article">
    {#if study === ''}
        <p>📝 Does not exist</p>
    {:else}
        {@html parseMarkdown(study)}
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
