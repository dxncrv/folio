<!--
  Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
-->
<script lang="ts">

import { onMount } from 'svelte';

let cursorX = 0, cursorY = 0, showCircle = false, size = 32;
let lastX = 0, lastY = 0;
let decayTimeout: ReturnType<typeof setTimeout> | null = null;

function isBgColored(el: Element | null): boolean {
    if (!el) return false;
    const style = getComputedStyle(el);
    const bg = style.backgroundColor;
    return typeof bg === 'string' && !['transparent', 'rgba(0, 0, 0, 0)', 'inherit'].includes(bg);
}

function updateCursor(e: MouseEvent) {
    cursorX = e.clientX;
    cursorY = e.clientY;

    const dx = cursorX - lastX;
    const dy = cursorY - lastY;
    const dist = Math.hypot(dx, dy);

    // Smooth size increase, clamp between 32 and 64
    size = Math.max(32, Math.min(64, size + dist * 0.05));

    lastX = cursorX;
    lastY = cursorY;

    // Find nearest colored ancestor
    let el = document.elementFromPoint(cursorX, cursorY);
    while (el && el !== document.body && !isBgColored(el)) {
        el = el.parentElement;
    }
    showCircle = !(el && el !== document.body);

    // Reset decay timer
    if (decayTimeout) clearTimeout(decayTimeout);
    decayTimeout = setTimeout(() => {
        size = 32;
    }, 700);
}

function handleMouseMove(e: MouseEvent) {
    updateCursor(e);
}

function handleMouseLeave() {
    showCircle = false;
    if (decayTimeout) clearTimeout(decayTimeout);
    size = 32;
}

onMount(() => {
    // Initialize lastX/Y to avoid jump on first move
    lastX = window.innerWidth / 2;
    lastY = window.innerHeight / 2;
});
</script>

<svelte:body onmousemove={handleMouseMove} onmouseleave={handleMouseLeave} />

<div
  class="cursor-circle"
  style="--circle-size: {size}px; left: {cursorX}px; top: {cursorY}px; opacity: {showCircle ? 1 : 0};"
></div>

<style>
.cursor-circle {
    width: var(--circle-size, 2rem);
    height: var(--circle-size, 2rem);
}

.cursor-circle {
    position: fixed;
    pointer-events: none;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: transparent;
    transform: translate(-50%, -50%);
    z-index: 9999;
    transition: opacity 0.2s, width 0.1s, height 0.1s;
    will-change: width, height, opacity, transform;
}

</style>
<!-- Portfolio component by @dxncrv - https://dxncrv.com -->
<!-- Created: 2025-08-08 - Do not use without permission -->