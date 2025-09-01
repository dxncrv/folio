<script lang="ts">
    import images from '$lib/images/index';
    import { Typer } from '$lib';
    import { slugify } from '$lib/utils';
    let { project } = $props();

    // Type-safe access to the images map (index.js exports a plain object)
    const imgMap: Record<string, any> = images as Record<string, any>;
    const imageSrc = imgMap[project.image] ?? '';

    // hashmap for tech icons
    const techIcons: Record<string, string> = {
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

    // Removes 'https://','www.', and everything after '.com' or '.org' etc.
    function cleanLink(link: string): string {
        return link.replace(/^(https?:\/\/)?(www\.)?/, '').split(/[/?#]/)[0];
    }
</script>

<div class="project">
    <a class="toastylink" href={project.link} target="_blank" rel="noopener noreferrer">{cleanLink(project.link)}
    </a>
    <a
        data-sveltekit-preload-data
        href={'projects/' + slugify(project.title)}>
    <enhanced:img src={imageSrc} alt={project.title} />
        <h2>
            <iconify-icon class="case-study" icon="line-md:folder-multiple-twotone" height=24 width=24></iconify-icon>
            <span class="title">{project.title}</span>
        </h2>
    </a>
    <Typer text={project.desc} />
    <ul>
        {#each project.tech as t}
            <li>
                <iconify-icon icon={techIcons[t] || ''} height=16 width=16></iconify-icon>
                &nbsp;
                {t}
            </li>
        {/each}
    </ul>
</div>

<style>
    :global(.toastylink) {
        position:absolute;
        top:-2rem;
        left: 50%;
        transform: translateX(-50%);
        color: rgb(15, 166, 236);
        font-family: var(--font-ui);
        text-decoration: none;
    }

    .project {
        position: relative;
        max-width: 25rem;
        width: 100%;
        margin: 0 auto;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 1rem;
        background: var(--bg);
        border: 1px solid var(--outline);
        border-radius: 1rem;
        transition:
            color 0.3s,
            border 0.3s,
            box-shadow 0.3s;
    }
    .project:hover {
        border: 1px solid var(--accent);
    }
    a:hover .case-study, a:hover span{
        color: var(--accent);
        animation: none;
    }
    .title {
        color: var(--contrast);
    }.title:hover {
        color: var(--accent);
        animation: none;
    }
    .case-study {
        margin-right: 1rem;
        margin-left: 0.25rem;
        animation: color-oscillate 1.5s alternate infinite;
    }
    a {
        display: flex;
        height: auto;
        flex-direction: column;
        gap: 1.25rem;
        text-decoration: none;
        transition: color 0.3s;
    }
    h2 {
        display: flex;
    }

    enhanced\:img {
        height: auto;
        width: 100%;
		border-radius: 0.5rem;
		object-fit: contain;
		transition: scale 0.3s;
    }
    
    ul {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        list-style-type: none;
    }
    li {
		display: flex;
		align-items: center;
        font-family: sans-serif;
        font-size: 0.7rem;
        color: var(--contrast);
		background: var(--body-bg);
		padding: 0.25rem 0.25rem;
		border-radius: 0.25rem;
    }
    @media (max-width: 768px) {
        .project {
            margin-top: 1.5rem;
            border: 1px solid var(--font-dim);
        }
        .project:hover {
            border: 1px solid var(--outline);
            box-shadow: none;
        }
    }
    @keyframes color-oscillate {
        0% {
            color: var(--accent);
        }
        100% {
            color: var(--accent-dim);
        }
    }
</style>