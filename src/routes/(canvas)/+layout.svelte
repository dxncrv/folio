<main class="dotted-bg">
    <div class="content">
        <slot />
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        margin: 2rem 2rem 2rem 2rem;
        height: calc(100vh - 4rem);
        width: calc(100% - 4rem);
        background: black;
        border-radius: 1rem;
        overflow: hidden;
        background-image: radial-gradient(circle, rgba(105, 105, 105, 0.3) 1px, transparent 1px);
        background-size: 24px 24px;
        background-position: center center;
    }
    .content {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    @media (max-width: 768px) {
        main {
            margin: 0.65rem 1rem 0.65rem 1rem;
            height: calc(100vh - 1.25rem);
            width: calc(100% - 1.25rem);
            border-radius: 0.5rem;
        }
    }
</style>