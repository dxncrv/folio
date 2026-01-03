<script lang="ts">
    import images from '$lib/images/index';
    import { Typer, slugify } from '$lib';
    import ProjectTags from './project-tags.svelte';
    
    let { project } = $props();
    let loaded = $state(false);
    
    const utils = $derived({
        studyLink: 'projects/' + (project.slug || slugify(project.title)),
        imageSrc: (images as Record<string, any>)[project.image] ?? '',
        tidyLink: project.link.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0]
    });
</script>

<div class="project">
    <!-- {#if project.link}
    <a class="toastylink" href={project.link} target="_blank" rel="noopener noreferrer">
        {utils.tidyLink}
        <iconify-icon icon="line-md:link" height="16" width="16"></iconify-icon>
    </a>
    {/if} -->
    <!-- Project metadata -->
    <a data-sveltekit-preload-data href={utils.studyLink}>
        <div class="img-container" class:shimmer={!loaded}>
            <enhanced:img 
                src={utils.imageSrc} 
                alt={project.title} 
                loading="lazy" 
                onload={() => loaded = true}
                class:loading={!loaded}
            />
        </div>
        <h2>
            <span class="title">{project.title}</span>
            <iconify-icon class="case-study" icon="line-md:chevron-right-circle" height="24" width="24" ></iconify-icon>
        </h2>
    </a>
    <!-- Tech used -->
    <!-- <Typer text={project.desc} /> -->
    <ProjectTags tech={project.tech} />
</div>

<style>
    .toastylink{display:flex;flex-direction:row;gap:0.5rem;position:absolute;top:-0.9rem;right:1rem;color:rgb(15,166,236);font-family:var(--font-ui);text-decoration:none; background:var(--body-bg);padding:0.25rem 0.75rem;border-radius:12px;}.toastylink:hover{background:var(--bg);border-color:var(--accent);color:var(--accent)}
    .project{position:relative;max-width:25rem;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:1.25rem;padding:1rem;background:var(--bg);border:1px solid var(--outline);border-radius:1rem;transition:border 0.3s ease;}.project:hover{border-color:var(--accent)}a{display:flex;flex-direction:column;gap:1.25rem;text-decoration:none;transition:color 0.3s ease}a:hover :where(.case-study,.title){color:var(--accent);animation:none}.title{color:var(--contrast)}.case-study{margin-left:1rem;margin-right:0.25rem;animation:color-oscillate 1.5s alternate infinite}@media(prefers-reduced-motion){.case-study{animation:none}}h2{display:flex;align-items:center}.img-container{width:100%;height:auto;border-radius:0.5rem;overflow:hidden}enhanced\:img{width:100%;height:auto;border-radius:0.5rem;object-fit:contain;transition:scale 0.3s ease;min-height:150px}@media(max-width:768px){.project{border-color:var(--font-dim)}.project:hover{border-color:var(--accent)}}@keyframes color-oscillate{from{color:var(--accent)}to{color:var(--accent-dim)}}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:0.25rem}
</style>