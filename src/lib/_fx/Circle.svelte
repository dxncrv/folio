<!--
  Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
-->
<script lang="ts">
import { CircleFx } from '$lib/_fx/一.svelte.ts';

const circle = new CircleFx();
</script>

<svelte:body onmousemove={circle.onMove} onmouseleave={circle.onLeave} />

<div
  class="cursor-circle"
  style="--circle-base: {circle.BASE}px; --circle-scale: {circle.cursor.size / circle.BASE}; left: {circle.cursor.x}px; top: {circle.cursor.y}px; opacity: {circle.cursor.visible ? 1 : 0};"
></div>

<style>.cursor-circle{position:fixed;left:0;top:0;width:var(--circle-base,32px);height:var(--circle-base,32px);pointer-events:none;border-radius:50%;border:2px solid var(--accent);background:transparent;transform:translate(-50%,-50%) scale(var(--circle-scale,1));z-index:9999;transition:opacity .18s linear,transform .12s ease;will-change:transform,opacity}</style>
<!-- Portfolio component by @dxncrv - https://dxncrv.com -->
<!-- Created: 2025-08-08 - Do not use without permission -->