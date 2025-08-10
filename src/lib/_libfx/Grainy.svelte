<!-- An adaptation of grainy gradients made by @anatudor https://codepen.io/thebabydino/pen/azONXNb -->
<script>
  let cardOpacity = $state(0);

  $effect(() => {
    setTimeout(() => {
      cardOpacity = 0.28;
    }, 0);
  });
</script>

<main id="grainy">
<svg width="0" height="0" aria-hidden="true">
    <filter id="grain" color-interpolation-filters="sRGB" primitiveUnits="objectBoundingBox">
    <feTurbulence type="fractalNoise" baseFrequency=".713" numOctaves="4"></feTurbulence>
    <feDisplacementMap in="SourceGraphic" scale=".1" xChannelSelector="R"></feDisplacementMap>
    <feBlend in2="SourceGraphic"></feBlend>
    </filter>
</svg>
<svg class="card" style="opacity: {cardOpacity}; transition: opacity 1s;">
    <linearGradient id="g11">
      <stop stop-color={`#${Math.floor(Math.random()*16777215).toString(16)}`}></stop>
      <stop stop-color={`#${Math.floor(Math.random()*16777215).toString(16)}`} offset="1"></stop>
    </linearGradient>
    <linearGradient id="g12">
      <stop stop-color={`#${Math.floor(Math.random()*16777215).toString(16)}`} offset=".2"></stop>
      <stop stop-color={`#${Math.floor(Math.random()*16777215).toString(16)}`} offset=".6"></stop>
      <stop stop-color={`#${Math.floor(Math.random()*16777215).toString(16)}`} offset="1"></stop>
    </linearGradient>
    <linearGradient id="g13">
      <stop stop-color={`#${Math.floor(Math.random()*16777215).toString(16)}`} offset=".2"></stop>
      <stop stop-color={`#${Math.floor(Math.random()*16777215).toString(16)}`} offset=".6"></stop>
      <stop stop-color={`#${Math.floor(Math.random()*16777215).toString(16)}`} offset="1"></stop>
    </linearGradient>
    <g>
      <rect width="100%" height="100%" fill="transparent"></rect>
      <ellipse rx="{Math.random() * 20 + 40}%" ry="{Math.random() * 10 + 35}%" fill="url(#g11)"></ellipse>
      <ellipse rx="{Math.random() * 20 + 30}%" ry="{Math.random() * 10 + 25}%" fill="url(#g12)"></ellipse>
      <ellipse rx="{Math.random() * 15 + 20}%" ry="{Math.random() * 10 + 15}%" fill="url(#g13)"></ellipse>
    </g>
</svg>
</main>

<style>
  #grainy {
    flex: 0;
  }
svg[height="0"][aria-hidden=true] {
  position: fixed;
}
.card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
}

g {
  filter: url(#grain);
}
rect, ellipse {
  transform-box: fill-box;
  transform-origin: 50%;
}
ellipse {
  cx: 50%;
  cy: 50%;
  /* filter: blur(calc(4vmin + 4vmax)); */
}
.card:nth-child(2) ellipse {
  rotate: -22.5deg;
  mix-blend-mode: color-burn;
}
.card:nth-child(2) ellipse:nth-of-type(2) {
  cx: 62.5%;
  rotate: 45deg;
}
.card:nth-child(2) ellipse:nth-of-type(3) {
  cy: 37.5%;
  rotate: -75deg;
}

@media (max-width: 768px) {
  ellipse {
      filter: blur(calc(4vmin + 4vmax));
  }
}
</style>