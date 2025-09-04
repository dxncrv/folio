<!--
  Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
-->
<script lang="ts">

const BASE = 32;
let cursor = $state({ x: 0, y: 0, visible: false, size: BASE });
let last = $state({ x: 0, y: 0 });

let decayTimeout: ReturnType<typeof setTimeout> | null = null;
let raf: number | null = null;
let nextX = 0,
    nextY = 0;

const isBgColored = (el: Element | null) =>
    el ? !['transparent', 'rgba(0, 0, 0, 0)', 'inherit'].includes(getComputedStyle(el).backgroundColor) : false;

function resetSize() {
    cursor.size = BASE;
}

function scheduleDecay() {
    if (decayTimeout) clearTimeout(decayTimeout);
    decayTimeout = setTimeout(resetSize, 700);
}

function processMouse() {
    raf = null;
    const x = nextX;
    const y = nextY;

    // update visible position used by the DOM
    cursor.x = x;
    cursor.y = y;

    const dist = Math.hypot(x - last.x, y - last.y);
    cursor.size = Math.max(BASE, Math.min(64, cursor.size + dist * 0.06));
    last.x = x;
    last.y = y;

    // determine if cursor should hide over a non-transparent background
    let el = document.elementFromPoint(x, y);
    while (el && el !== document.body && !isBgColored(el)) el = el.parentElement;
    cursor.visible = !(el && el !== document.body);

    scheduleDecay();
}

function onMove(e: MouseEvent) {
    nextX = e.clientX;
    nextY = e.clientY;
    if (raf == null) raf = requestAnimationFrame(processMouse);
}

function onLeave() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    cursor.visible = false;
    if (decayTimeout) clearTimeout(decayTimeout);
    resetSize();
}

// Avoid an initial jump
$effect(() => {
    last.x = cursor.x;
    last.y = cursor.y;
});
</script>

<svelte:body onmousemove={onMove} onmouseleave={onLeave} />

<div
  class="cursor-circle"
  style="--circle-base: {BASE}px; --circle-scale: {cursor.size / BASE}; left: {cursor.x}px; top: {cursor.y}px; opacity: {cursor.visible ? 1 : 0};"
></div>

<style>
.cursor-circle {
    position: fixed;
    left: 0;
    top: 0;
    width: var(--circle-base, 32px);
    height: var(--circle-base, 32px);
    pointer-events: none;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: transparent;
    transform: translate(-50%, -50%) scale(var(--circle-scale, 1));
    z-index: 9999;
    transition: opacity 0.18s linear, transform 0.12s ease;
    will-change: transform, opacity;
}

</style>
<!-- Portfolio component by @dxncrv - https://dxncrv.com -->
<!-- Created: 2025-08-08 - Do not use without permission -->