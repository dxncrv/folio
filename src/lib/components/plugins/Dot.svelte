<script lang="ts">
	import { page } from '$app/state';

	let dotEl: HTMLSpanElement;

	const moveDot = (e: HTMLElement | null) => {
		if (!dotEl || !e) return;
		dotEl.style.opacity = '1'; // makes the dot visible
		dotEl.style.translate = `calc(${e.offsetLeft + e.offsetWidth / 2}px - 100%) 150%`; // positions the dot at the center of (e)
	};

	$effect(() => {
		moveDot(document.querySelector(`a[href='${page.route.id}']`));
	});
</script>

<span class="dot" bind:this={dotEl}></span>

<style>
	.dot {
		position: absolute;
		bottom: 0;
		width: 0.35rem;
		height: 0.2rem;
		translate: -100% 50%;
		border-radius: 50%;
		background: var(--accent);
		opacity: 0;
		transition:
			translate 0.3s,
			opacity 0.3s ease-in-out;
	}
</style>
