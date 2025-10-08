<h1>Experimental</h1>
<main class="dotted-bg">
    <slot />
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0rem 2rem 2rem 2rem;
        height: calc(100% - 4rem);
        width: calc(100% - 4rem);
        background: black;
        border-radius: 1rem;
        overflow: hidden;
        background-image: radial-gradient(circle, rgba(105, 105, 105, 0.3) 1px, transparent 1px);
        background-size: 24px 24px;
        background-position: center center;
    }
    h1 {
        padding: 1rem;
        font-family: var(--font-ui);
        font-size: 2rem;
        color: var(--contrast);
    }

    @media (max-width: 768px) {
        main {
            margin: 0rem 1rem 1rem 1rem;
            height: calc(100% - 2rem);
            width: calc(100% - 2rem);
            border-radius: 0.5rem;
        }
        h1 {
            font-size: 1.5rem;
        }
    }
</style>