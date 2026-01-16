<script lang="ts">
    import { Typer, slugify } from '$lib';
    import ProjectTags from './project-tags.svelte';
    
    // Get PB URL from environment (injected by SvelteKit into browser globals)
    import { dev } from '$app/environment';
    
    let { project } = $props();
    let imageLoaded = $state(false);
    
    // Construct PocketBase file URL
    const getPBFileUrl = (collectionId: string, recordId: string, filename: string): string => {
        // Use the public PocketBase URL from environment variables
        const pbUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
        return `${pbUrl}/api/files/${collectionId}/${recordId}/${filename}`;
    };
    
    const utils = $derived({
        studyLink: 'projects/' + (project.slug || slugify(project.title)),
        imageSrc: project.image && project.collectionId && project.id 
            ? getPBFileUrl(project.collectionId, project.id, project.image)
            : '',
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
        <!-- Image container with shimmer shown immediately -->
        <div class="img-container" class:loaded={imageLoaded}>
            {#if utils.imageSrc}
                <img 
                    src={utils.imageSrc} 
                    alt={project.title} 
                    loading="lazy" 
                    onload={() => imageLoaded = true}
                    onerror={() => imageLoaded = true}
                    class:fade-in={imageLoaded}
                />
            {/if}
        </div>
        <!-- Title with skeleton shimmer while content loads -->
        <h2 class:loaded={imageLoaded}>
            <span class="title">{project.title}</span>
            <iconify-icon class="case-study" icon="line-md:chevron-right-circle" height="24" width="24" ></iconify-icon>
        </h2>
    </a>
    <!-- Tags with skeleton shimmer -->
    <div class:loaded={imageLoaded}>
        <ProjectTags tech={project.tech} />
    </div>
</div>

<style>
    .project {
        position: relative;
        max-width: 25rem;
        width: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 1rem;
        background: var(--bg);
        border: 1px solid var(--outline);
        border-radius: 1rem;
        transition: border 0.3s ease;
    }

    .project:hover {
        border-color: var(--accent);
    }

    a {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        text-decoration: none;
        transition: color 0.3s ease;
        position: relative;
    }

    a:hover :where(.case-study, .title) {
        color: var(--accent);
        animation: none;
    }

    .title {
        color: var(--contrast);
    }

    .case-study {
        margin-left: 1rem;
        margin-right: 0.25rem;
        animation: color-oscillate 1.5s alternate infinite;
    }

    @media (prefers-reduced-motion) {
        .case-study {
            animation: none;
        }
    }

    h2 {
        display: flex;
        align-items: center;
        transition: opacity 0.4s ease;
    }

    h2:not(.loaded) {
        opacity: 0.5;
        color: var(--font-dim);
    }

    /* Skeleton shimmer for title while loading */
    h2:not(.loaded)::after {
        content: '';
        display: block;
        position: absolute;
        width: 100%;
        height: 1.5em;
        border-radius: 0.25rem;
        background: var(--font-dim);
        opacity: 0.1;
        animation: shimmer 1.5s infinite;
    }

    .img-container {
        width: 100%;
        height: 150px;
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--bg);
        /* Show shimmer by default until image loads */
        position: relative;
    }

    .img-container::after {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        transform: translateX(-100%);
        background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            var(--shimmer-color) 20%,
            var(--shimmer-color) 60%,
            rgba(255, 255, 255, 0)
        );
        animation: shimmer 1.5s infinite;
        content: '';
        pointer-events: none;
    }

    /* Remove shimmer once image is loaded */
    .img-container.loaded::after {
        animation: none;
        display: none;
    }

    img {
        width: 100%;
        height: 100%;
        border-radius: 0.5rem;
        object-fit: contain;
        transition: opacity 0.4s ease;
        opacity: 0;
    }

    img.fade-in {
        opacity: 1;
    }

    @media (max-width: 768px) {
        .project {
            border-color: var(--font-dim);
        }

        .project:hover {
            border-color: var(--accent);
        }
    }

    @keyframes color-oscillate {
        from {
            color: var(--accent);
        }

        to {
            color: var(--accent-dim);
        }
    }

    a:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
        border-radius: 0.25rem;
    }
</style>