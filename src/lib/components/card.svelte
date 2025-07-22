<script lang="ts">
    import { slugify } from '$lib/utils';
    import { createTypewriter } from '$lib/store.svelte';
    let { project } = $props();

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

    // Typewriter and truncation logic for descriptions
    const typewriter = createTypewriter(30, 20, 10);

    function toggleDescription() {
        typewriter.toggle();
    }

    // Removes 'https://','www.', and everything after '.com' or '.org' etc.
    function cleanLink(link: string): string {
        return link.replace(/^(https?:\/\/)?(www\.)?/, '').split(/[/?#]/)[0];
    }

    // Watch for project description changes
    $effect(() => {
        typewriter.processText(project.desc);
    });
</script>
<div class="project">
    <a class="toastylink" href={project.link} target="_blank" rel="noopener noreferrer">{cleanLink(project.link)}
    </a>
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
        <span class="typewriter-text">{typewriter.text}</span>
        {#if typewriter.isTyping}
            <span class="cursor">|</span>
        {/if}
        {#if typewriter.shouldShowButton(project.desc.length)}
            <button class="description" type="button" onclick={toggleDescription}>
                {typewriter.getButtonText()}
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
    .project p {
        height: 100%;
        color: var(--contrast);
        line-height: calc(var(--line-height) * 1.5);
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        background: var(--body-bg);
    }   
    .description {
        background: none;
        border: none;
        color: var(--accent-dim);
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        transition: color 0.3s, background-color 0.3s;
    }
    .description:hover {
        color: var(--accent);
    }
    .typewriter-text {
        display: inline;
    }
    .cursor {
        display: inline-block;
        animation: blink 1s infinite;
        color: var(--accent);
        font-weight: bold;
    }
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
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