<script lang="ts">
    import { slugify } from '$lib/utils';
    let { project } = $props();

    // make a hashmap that maps tech names to their icons
    const techIcons: Record<string, string> = {
        'Svelte': 'material-icon-theme:svelte',
        'TypeScript': 'material-icon-theme:typescript',
        'Figma': 'material-icon-theme:figma',
        'Blender': 'logos:blender',
        'Photoshop': 'logos:adobe-photoshop',
        'Illustrator': 'logos:adobe-illustrator',
        'Premiere Pro': 'logos:adobe-premiere',
        'Unity': 'material-icon-theme:unity',
        'C Sharp': 'material-icon-theme:csharp',
    };

    const MAX_LENGTH = 35;
    let isTruncated = $state(true);
    let displayDesc = $state('');

    function toggleDescription() {
        isTruncated = !isTruncated;
    }

    $effect(() => {
        if (isTruncated && project.desc.length > MAX_LENGTH) {
            let truncated = project.desc.slice(0, MAX_LENGTH);
            // Truncate at the last space to avoid cutting a word
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > 0) {
                truncated = truncated.slice(0, lastSpace);
            }
            displayDesc = truncated + '...';
        } else {
            displayDesc = project.desc;
        }
    });
</script>

<div class="project">
    <a
        data-sveltekit-preload-data
        href={'projects/' + slugify(project.title)}>
        <img src={project.image} alt={project.title} />
        <h2>
            <iconify-icon class="case-study" icon="line-md:folder-multiple-twotone" height=24 width=24></iconify-icon>
            <span class="title">{project.title}</span>
        </h2>
    </a>
    <p>
        {displayDesc}
        {#if project.desc.length > MAX_LENGTH}
            <button class="toggleDesc" type="button" onclick={toggleDescription}>
                {isTruncated ? 'More' : 'Less'}
            </button>
        {/if}
    </p>
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
    .project {
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
    .project p {
        height: 100%;
        color: var(--contrast);
        line-height: calc(var(--line-height) * 1.5);
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        background: var(--body-bg);
    }   
    .toggleDesc {
        background: none;
        border: none;
        color: var(--accent-dim);
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        transition: color 0.3s, background-color 0.3s;
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
        flex-direction: column;
        gap: 1.25rem;
        text-decoration: none;
        transition: color 0.3s;
    }
    h2 {
        display: flex;
    }

    img {
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