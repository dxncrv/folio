<!--
  Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
-->

<script lang="ts">
  import { TyperFx } from '$lib/_fx/一.svelte.ts';
  let { text } = $props();

  const typer = new TyperFx(
    {
      maxLength: 30,
      speed: 20 
    }
  );

  $effect(() => {
  typer.processText(text);
  });
</script>

<p>
  <span class="typer-text">{typer.state.text}</span>
  {#if typer.state.typing}
    <span class="cursor">|</span>
  {/if}
  {#if typer.showButton(text.length)}
    <button class="description" type="button" onclick={typer.toggle}>
      {typer.buttonText}
    </button>
  {/if}
</p>

<style>p{height:100%;color:var(--contrast);line-height:calc(var(--line-height)*1.5);padding:.75rem 1.25rem;border-radius:.5rem;background:var(--body-bg)}.typer-text{display:inline}.cursor{display:inline-block;animation:blink 1s infinite;color:var(--accent);font-weight:700}.description{background:none;border:none;color:var(--accent-dim);cursor:pointer;font-size:.8rem;padding:.25rem .5rem;border-radius:.25rem;transition:color 0.3s,background-color 0.3s}.description:hover{color:var(--accent)}@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}</style>
<!-- Portfolio component by @dxncrv - https://dxncrv.com -->
<!-- Created: 2025-08-08 - Do not use without permission -->