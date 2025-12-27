<!-- Inspired from @anatudor https://codepen.io/thebabydino/pen/azONXNb -->
<script lang="ts">
	import { themeStore } from '$lib/theme.svelte';

	const CONFIG = {
		STOPS: [[0, 1], [0.2, 0.6, 1], [0.2, 0.6, 1]],
		RANGES: [[30, 45, 26.25, 30], [22.5, 37.5, 18.75, 22.5], [15, 26.25, 11.25, 15]],
		TRANSFORMS: [[0, 0, -22.5], [0.125, 0, 45], [0, -0.125, -75]]
	} as const;

	let texture = $state<string | null>(null);
	let mouse = $state({ x: 0, y: 0 });
	let scrollY = $state(0);
	let win = $state({ w: 0, h: 0 });

	const hsl = (h: number) => `hsl(${h}, ${70 + Math.random() * 20}%, ${50 + Math.random() * 20}%)`;

	async function createTexture(blendMode: string): Promise<string> {
		const { innerWidth: w, innerHeight: h } = window;
		const canvas = new OffscreenCanvas(w, h);
		const ctx = canvas.getContext('2d')!;
		ctx.filter = `blur(${w <= 768 ? 70 : 50}px)`;

		const baseHue = Math.random() * 360;
		const hues = [0, 1, 2].map(i => (baseHue + i * 120) % 360);

		CONFIG.RANGES.forEach(([rxMin, rxMax, ryMin, ryMax], i) => {
			const grad = ctx.createLinearGradient(0, 0, w, h);
			CONFIG.STOPS[i].forEach(offset => grad.addColorStop(offset, hsl(hues[i] + Math.random() * 30 - 15)));

			ctx.save();
			ctx.translate(w / 2, h / 2);
			const [tx, ty, rot] = CONFIG.TRANSFORMS[i];
			ctx.translate(w * tx, h * ty);
			ctx.rotate(rot * Math.PI / 180);
			ctx.globalCompositeOperation = i ? blendMode as GlobalCompositeOperation : 'source-over';
			ctx.fillStyle = grad;
			ctx.beginPath();
			ctx.ellipse(0, 0, (w * (rxMin + Math.random() * (rxMax - rxMin))) / 100, (h * (ryMin + Math.random() * (ryMax - ryMin))) / 100, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});

		return URL.createObjectURL(await canvas.convertToBlob({ type: 'image/png' }));
	}

	$effect(() => {
		let active = true;
		createTexture(themeStore.blendMode).then(url => {
			if (active) texture = url;
			else URL.revokeObjectURL(url);
		});
		return () => {
			active = false;
			if (texture) URL.revokeObjectURL(texture);
		};
	});
</script>

<svelte:window 
	bind:innerWidth={win.w} bind:innerHeight={win.h} 
	onmousemove={e => { mouse.x = e.clientX; mouse.y = e.clientY; }} 
	onscroll={() => scrollY = window.scrollY} 
/>

<main id="grainy">
	<svg width="0" height="0" aria-hidden="true">
		<filter id="grain" color-interpolation-filters="sRGB" primitiveUnits="objectBoundingBox">
			<feTurbulence type="fractalNoise" baseFrequency=".713" numOctaves="1" />
			<feDisplacementMap in="SourceGraphic" scale=".1" xChannelSelector="R" />
			<feBlend in2="SourceGraphic" />
		</filter>
	</svg>
	{#if texture}
		{#key texture}
			<img 
				src={texture} alt=""
				style:transform="translate({(mouse.x - win.w/2) * 0.02}px, {(mouse.y - win.h/2) * 0.02 + Math.sin(scrollY * 0.002) * 10}px) scale(1.1)"	
			/>
		{/key}
	{/if}
</main>

<style>#grainy{flex:0;overflow:hidden}svg{position:fixed}img{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;filter:url(#grain);pointer-events:none;animation:fadeIn 1s forwards;will-change:transform}@keyframes fadeIn{from{opacity:0}to{opacity:.21}}</style>
