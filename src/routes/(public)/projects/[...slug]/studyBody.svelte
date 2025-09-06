
<script lang="ts">
    import { page } from '$app/state';
    import { parseMarkdown } from '$lib/utils';
    import { CaseStudies } from '$lib/store.svelte.ts';

    let content: string | null = $state(null);
    let slug = $state('');

    $effect(() => {
        const s = page.params?.slug ?? '';
        slug = s;
        if (!s) {
            content = '';
            return;
        }

        // Use cached content immediately when available; otherwise show loader
        const cached = CaseStudies.all.find(x => x.slug === s);
        content = cached?.content ?? null;

        // Fetch authoritative content. Guard against stale responses when slug changes.
        const requestSlug = s;
        CaseStudies.fetchBySlug(s).then(cs => {
            if (slug !== requestSlug) return;
            content = cs?.content ?? '';
        });
    });
</script>

<div class="article">
    {#if CaseStudies.errorBySlug[slug]}
        <div class="error">Error: {CaseStudies.errorBySlug[slug]}</div>
    {:else if content === null}
        <!-- unknown yet -->
        <div class="loader" aria-live="polite" aria-busy="true">
            <iconify-icon icon="line-md:loading-twotone-loop" width="28" height="28"></iconify-icon>
        </div>
    {:else if content === ''}
        <p>📝 - Writing in progress...</p>
    {:else}
        {#if CaseStudies.loadingBySlug[slug]}
            <div class="refreshing">Refreshing…</div>
        {/if}
        {@html parseMarkdown(content)}
    {/if}
</div>

<style>:global(.article a){color:rgb(15,166,236);font-family:var(--font-ui);text-decoration:none}:global(.article video){width:100%}:global(.article p){font-size:calc(var(--font-size)*1.15);padding:1rem;line-height:calc(var(--line-height)*1.75)}.article{display:flex;flex-direction:column}:global(.article h2){border-top:1px solid var(--font-dim);font-family:var(--font-ui);color:var(--accent);font-size:calc(var(--font-size)*1.5);padding:1rem}:global(.article ul){padding-left:3rem;margin-bottom:1rem}:global(.article li){line-height:calc(var(--line-height)*1.5);font-family:var(--font-read);font-size:calc(var(--font-size)*1.15);color:var(--contrast)}:global(.article img){width:100%}@media(max-width:768px){:global(.article img){width:100%}}.loader{font-family:var(--font-ui);padding:2rem;text-align:center;color:var(--font-color)}.error{padding:1rem;background:rgba(255,100,100,0.06);border:1px solid rgba(255,100,100,0.12);color:#ff6b6b;border-radius:0.5rem}.refreshing{font-size:0.85rem;color:var(--font-dim);padding:0.25rem 0.5rem;border-radius:0.25rem;margin-bottom:0.5rem}</style>
