<!-- Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
-->
<script lang="ts">
	import { page } from '$app/state';
	let dotEl: HTMLSpanElement;
	const moveDot = (e: HTMLElement | null) => {
		if (!dotEl || !e) return;
		dotEl.style.opacity = '1';
		dotEl.style.translate = `calc(${e.offsetLeft + e.offsetWidth / 2}px - 100%) 150%`;
	};
	$effect(() => {
		moveDot(document.querySelector(`a[href='${page.url.pathname}']`));
	});
</script>

<span class="dot" bind:this={dotEl}></span>

<style>:global(.dot){position:absolute;bottom:0;width:.35rem;height:.2rem;translate:-100% 50%;border-radius:50%;background:var(--accent);opacity:0;transition:translate 0.3s,opacity 0.3s}</style>
<!-- Portfolio component by @dxncrv - https://dxncrv.com -->
<!-- Created: 2025-08-08 - Do not use without permission -->