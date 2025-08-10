<!--
  Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
-->
<script lang="ts">
let cursor = $state({ x: 0, y: 0, visible: false, size: 32 });
let last = $state({ x: 0, y: 0 });
let decayTimeout: ReturnType<typeof setTimeout> | null = null;

const isBgColored = (el: Element | null) =>
    el ? !['transparent', 'rgba(0, 0, 0, 0)', 'inherit'].includes(getComputedStyle(el).backgroundColor) : false;

function resetCursorSize() {
    cursor.size = 32;
}

function updateCursor(e: MouseEvent) {
    cursor.x = e.clientX;
    cursor.y = e.clientY;

    const dist = Math.hypot(cursor.x - last.x, cursor.y - last.y);
    cursor.size = Math.max(32, Math.min(64, cursor.size + dist * 0.05));

    last.x = cursor.x;
    last.y = cursor.y;

    // Find nearest colored ancestor
    let el = document.elementFromPoint(cursor.x, cursor.y);
    while (el && el !== document.body && !isBgColored(el)) el = el.parentElement;
    cursor.visible = !(el && el !== document.body);

    if (decayTimeout) clearTimeout(decayTimeout);
    decayTimeout = setTimeout(resetCursorSize, 700);
}

function handleMouseMove(e: MouseEvent) {
    updateCursor(e);
}

function handleMouseLeave() {
    cursor.visible = false;
    if (decayTimeout) clearTimeout(decayTimeout);
    resetCursorSize();
}

// Prevent jump on first move
$effect(() => {
    last.x = cursor.x;
    last.y = cursor.y;
});
</script>

<svelte:body onmousemove={handleMouseMove} onmouseleave={handleMouseLeave} />

<div
  class="cursor-circle"
  style="--circle-size: {cursor.size}px; left: {cursor.x}px; top: {cursor.y}px; opacity: {cursor.visible ? 1 : 0};"
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