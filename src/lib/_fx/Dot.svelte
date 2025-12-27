<script lang="ts">
	import { page } from '$app/state';
	let dotEl: HTMLSpanElement;
	$effect(() => {
		const active = document.querySelector(`a[href='${page.url.pathname}']`) as HTMLElement;
		if (dotEl && active) {
			dotEl.style.opacity = '1';
			dotEl.style.translate = `calc(${active.offsetLeft + active.offsetWidth / 2}px - 100%) 150%`;
		}
	});
</script>

<span class="dot" bind:this={dotEl}></span>

<style>.dot{position:absolute;bottom:0;width:.35rem;height:.2rem;translate:-100% 50%;border-radius:50%;background:var(--accent);opacity:0;transition:translate 0.3s,opacity 0.3s}</style>
