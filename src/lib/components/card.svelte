<script lang="ts">
    import images from '$lib/images/index';
    import { Typer } from '$lib';
    import { slugify } from '$lib/utils';
    
    let { project } = $props();
    
    const TECH_ICONS = {
        'Svelte': 'material-icon-theme:svelte',
        'TypeScript': 'material-icon-theme:typescript',
        'Figma': 'material-icon-theme:figma',
        'Blender': 'logos:blender',
        'Photoshop': 'logos:adobe-photoshop',
        'After Effects': 'logos-adobe-after-effects',
        'Illustrator': 'logos:adobe-illustrator',
        'Premiere Pro': 'logos:adobe-premiere',
        'Unity': 'material-icon-theme:unity',
        'C Sharp': 'material-icon-theme:csharp',
        'Rhino': 'simple-icons:rhinoceros',
    };
    
    const utils = $derived({
        studyLink: 'projects/' + slugify(project.title),
        imageSrc: (images as Record<string, any>)[project.image] ?? '',
        tidyLink: project.link.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0]
    });
</script>

<div class="project">
    <a class="toastylink" href={project.link} target="_blank" rel="noopener noreferrer">
        {utils.tidyLink}
    </a>
    <!-- Project metadata -->
    <a data-sveltekit-preload-data href={utils.studyLink}>
        <enhanced:img src={utils.imageSrc} alt={project.title} loading="lazy" />
        <h2>
            <iconify-icon class="case-study" icon="line-md:folder-multiple-twotone" height="24" width="24" ></iconify-icon>
            <span class="title">{project.title}</span>
        </h2>
    </a>
    <Typer text={project.desc} />
    <!-- Tech used -->
    <ul>
        {#each project.tech as tech (tech)}
            <li>
                <iconify-icon icon={TECH_ICONS[tech as keyof typeof TECH_ICONS] || ''} height="16" width="16" ></iconify-icon>
                <span>{tech}</span>
            </li>
        {/each}
    </ul>
</div>

<style>
    .toastylink{position:absolute;top:-2rem;left:50%;transform:translateX(-50%);color:rgb(15,166,236);font-family:var(--font-ui);text-decoration:none}.project{position:relative;max-width:25rem;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:1.25rem;padding:1rem;background:var(--bg);border:1px solid var(--outline);border-radius:1rem;transition:border 0.3s ease}.project:hover{border-color:var(--accent)}a{display:flex;flex-direction:column;gap:1.25rem;text-decoration:none;transition:color 0.3s ease}a:hover :where(.case-study,.title){color:var(--accent);animation:none}.title{color:var(--contrast)}.case-study{margin-right:1rem;margin-left:0.25rem;animation:color-oscillate 1.5s alternate infinite}@media(prefers-reduced-motion){.case-study{animation:none}}h2{display:flex;align-items:center}enhanced\:img{width:100%;height:auto;border-radius:0.5rem;object-fit:contain;transition:scale 0.3s ease}ul{display:flex;flex-wrap:wrap;gap:0.5rem;list-style:none;margin:0;padding:0}li{display:flex;align-items:center;gap:0.25rem;font-family:system-ui,sans-serif;font-size:0.7rem;color:var(--contrast);background:var(--body-bg);padding:0.25rem;border-radius:0.25rem}@media(max-width:768px){.project{margin-top:1.5rem;border-color:var(--font-dim)}.project:hover{border-color:var(--outline)}}@keyframes color-oscillate{from{color:var(--accent)}to{color:var(--accent-dim)}}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:0.25rem}
</style>