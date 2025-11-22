<!-- Inspired from @anatudor https://codepen.io/thebabydino/pen/azONXNb -->
<script lang="ts">
	import { themeStore, type BlendMode } from '$lib/theme.svelte';

	// Crypto-backed random generator
	const rand = (() => {
		const buf = new Uint32Array(1);
		return () => (crypto.getRandomValues(buf), buf[0] / 0xffffffff);
	})();
	// Generate random hex color
	const hex = () => `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, '0')}`;
	// Responsive blur radius
	const getBlurRadius = (w: number) => (w <= 768 ? 70 : 50);

	// Config: Gradient stops, ellipse sizes, and transforms
	const GRAD_STOPS=[[0,1],[.2,.6,1],[.2,.6,1]];
	const ELLIPSE_RANGES=[[30,45,26.25,30],[22.5,37.5,18.75,22.5],[15,26.25,11.25,15]];
	const TRANSFORMS=[[0,0,-22.5],[.125,0,45],[0,-.125,-75]];

	let texture = $state<string | null>(null);

	async function createTexture(blendMode: BlendMode): Promise<string> {
		const { innerWidth: w, innerHeight: h } = window;
		const canvas = new OffscreenCanvas(w, h);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas context unavailable');

		ctx.filter = `blur(${getBlurRadius(w)}px)`;

		// Step: Generate random gradient stops
		const gradStops = GRAD_STOPS.map((offsets) =>
			offsets.map((offset) => ({ offset, color: hex() }))
		);

		// Step: Generate random ellipse sizes
		const ellipses = ELLIPSE_RANGES.map(([rxMin, rxMax, ryMin, ryMax]) => ({
			rx: rxMin + rand() * (rxMax - rxMin),
			ry: ryMin + rand() * (ryMax - ryMin)
		}));

		// Step: Draw ellipses with gradients and theme-aware blending
		ellipses.forEach(({ rx, ry }, i) => {
			const grad = ctx.createLinearGradient(0, 0, w, h);
			gradStops[i].forEach(({ offset, color }) => grad.addColorStop(offset, color));

			ctx.save();
			ctx.translate(w / 2, h / 2);

			const [tx, ty, rot] = TRANSFORMS[i];
			if (tx || ty) ctx.translate(w * tx, h * ty);
			ctx.rotate((rot * Math.PI) / 180);

			// Use theme-aware blend mode for all ellipses
			ctx.globalCompositeOperation = i ? blendMode : 'source-over';
			ctx.fillStyle = grad;
			ctx.beginPath();
			ctx.ellipse(0, 0, (w * rx) / 100, (h * ry) / 100, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});

		const blob = await canvas.convertToBlob({ type: 'image/png', quality: 0.8 });
		return URL.createObjectURL(blob);
	}

	// Lifecycle: Initialize texture on mount with cleanup, regenerate when theme changes
	$effect.pre(() => {
		const blendMode = themeStore.blendMode;
		createTexture(blendMode).then((url) => (texture = url));
		
		return () => {
			if (texture) URL.revokeObjectURL(texture);
		};
	});
</script>

<main id="grainy">
	<svg width="0" height="0" aria-hidden="true">
		<filter id="grain" color-interpolation-filters="sRGB" primitiveUnits="objectBoundingBox">
			<feTurbulence type="fractalNoise" baseFrequency=".713" numOctaves="1" />
			<feDisplacementMap in="SourceGraphic" scale=".1" xChannelSelector="R" />
			<feBlend in2="SourceGraphic" />
		</filter>
	</svg>
	{#if texture}
		<img src={texture} alt="" />
	{/if}
</main>

<style>
	#grainy{flex:0}svg{position:fixed}img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;filter:url(#grain);pointer-events:none;animation:fadeIn 1s forwards}@keyframes fadeIn{from{opacity:0}to{opacity:0.32}}
</style>