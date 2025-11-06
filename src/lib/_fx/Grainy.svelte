<!-- Grainy gradients adapted from @anatudor https://codepen.io/thebabydino/pen/azONXNb -->
<script lang="ts">
	const rand = (() => {
		const buf = new Uint32Array(1);
		const hasCrypto = typeof crypto?.getRandomValues === 'function';
		return () => (hasCrypto ? (crypto.getRandomValues(buf), buf[0] / 0xffffffff) : Math.random());
	})();

	const hex = () => `#${Math.floor(rand() * 0xffffff).toString(16).padStart(6, '0')}`;

	let texturePromise = $state(createTexture());

	async function createTexture() {
		const { innerWidth: w, innerHeight: h } = window;
		const canvas = new OffscreenCanvas(w, h);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas context not available');

		ctx.filter = `blur(${w <= 768 ? 60 : 40}px)`;

		const gradStops = [
			[0, 1],
			[0.2, 0.6, 1],
			[0.2, 0.6, 1]
		].map((offsets) => offsets.map((offset) => ({ offset, color: hex() })));

		const ellipses = [
			[30, 45, 26.25, 30],
			[22.5, 37.5, 18.75, 22.5],
			[15, 26.25, 11.25, 15]
		].map(([rxMin, rxMax, ryMin, ryMax]) => ({
			rx: rxMin + rand() * (rxMax - rxMin),
			ry: ryMin + rand() * (ryMax - ryMin)
		}));

		const transforms = [
			[0, 0, -22.5],
			[0.125, 0, 45],
			[0, -0.125, -75]
		];

		ellipses.forEach(({ rx, ry }, i) => {
			const grad = ctx.createLinearGradient(0, 0, w, h);
			gradStops[i].forEach(({ offset, color }) => grad.addColorStop(offset, color));

			ctx.save();
			ctx.translate(w / 2, h / 2);
			const [tx, ty, rot] = transforms[i];
			if (tx || ty) ctx.translate(w * tx, h * ty);
			ctx.rotate((rot * Math.PI) / 180);
			ctx.globalCompositeOperation = i ? 'color-burn' : 'source-over';
			ctx.fillStyle = grad;
			ctx.beginPath();
			ctx.ellipse(0, 0, (w * rx) / 100, (h * ry) / 100, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});

		const blob = await canvas.convertToBlob({ type: 'image/png', quality: 0.8 });
		return URL.createObjectURL(blob);
	}

	$effect(() => {
		return () => {
			texturePromise?.then((url) => URL.revokeObjectURL(url));
		};
	});
</script>

<main id="grainy">
	<svg width="0" height="0" aria-hidden="true">
		<filter id="grain" color-interpolation-filters="sRGB" primitiveUnits="objectBoundingBox">
			<feTurbulence type="fractalNoise" baseFrequency=".713" numOctaves="4" />
			<feDisplacementMap in="SourceGraphic" scale=".1" xChannelSelector="R" />
			<feBlend in2="SourceGraphic" />
		</filter>
	</svg>
	{#await texturePromise}
		<!-- Optionally, show a loading state -->
	{:then texture}
		<img src={texture} alt="" />
	{:catch error}
		<!-- Optionally, handle texture generation errors -->
		<p style="color: red">{error.message}</p>
	{/await}
</main>

<style>
	#grainy {
		flex: 0;
	}
	svg {
		position: fixed;
	}
	img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: -1;
		filter: url(#grain);
		pointer-events: none;
		animation: fadeIn 1s forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 0.28;
		}
	}
</style>