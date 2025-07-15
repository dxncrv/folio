<a
	class="timemachine-btn"
	href="https://dxncrv.github.io/v3-react-portfolio/"
	aria-label="Old Portfolio"
>
	<iconify-icon
		icon="material-symbols:nest-clock-farsight-analog"
		width="24"
		height="24"
		aria-label="old portfolio"
	></iconify-icon>
</a>

<style>
	.timemachine-btn {
		position: fixed;
		right: 1.5rem;
		bottom: 1.5rem;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: var(--bg);
		color: var(--accent);
		border-radius: 2em;
		text-decoration: none;
		transition:
			background 0.2s,
			color 0.2s;
		overflow: visible;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	.timemachine-btn:hover,
	.timemachine-btn:focus {
		background: var(--accent);
		color: var(--bg);
	}
	.timemachine-btn::after {
		content: 'Visit old portfolio';
		position: absolute;
		right: 100%;
		bottom: 12.5%;
		margin-right: 0rem;
		background: var(--bg);
		color: var(--accent);
		padding: 0.5em 1em;
		border-radius: 1.5em 0 0 1.5em;
		white-space: nowrap;
		opacity: 0;
		transform: translateX(20px) scaleX(0.8);
		transition:
			opacity 0.2s,
			transform 0.2s;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		font-size: 1rem;
		font-family: var(--font-ui, sans-serif);
	}
	.timemachine-btn:hover::after,
	.timemachine-btn:focus::after {
		opacity: 1;
		transform: translateX(0) scaleX(1);
	}
</style>
