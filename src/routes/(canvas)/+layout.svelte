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
</style>