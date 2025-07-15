<script lang="ts">
	// Array of stack items with icon name and label
	const stack = [
		{ label: 'Excalidraw', icon: 'material-icon-theme:excalidraw' },
		{ label: 'VSCode', icon: 'material-icon-theme:vscode' },
		{ label: 'pnpm', icon: 'material-icon-theme:pnpm' },
		{ label: 'Git', icon: 'material-icon-theme:git' },

		{ label: 'Svelte', icon: 'material-icon-theme:svelte' },
		{ label: 'TypeScript', icon: 'vscode-icons:file-type-typescript' },
		{ label: 'React', icon: 'material-icon-theme:react' },
		{ label: 'Tailwind CSS', icon: 'logos:tailwindcss-icon' },

		{ label: 'Python', icon: 'material-icon-theme:python' },
		{ label: 'C Sharp', icon: 'material-icon-theme:csharp' }
	];
</script>

<main class="stack-icons">
	{#each stack as { icon, label }}
		<iconify-icon
			class="icon"
			{icon}
			height="18px"
			width="18px"
			data-label={label}
			aria-label={label}
		></iconify-icon>
	{/each}
	<p>..and more</p>
</main>

<style>
	.stack-icons {
		display: flex;
		flex-wrap: wrap; /* Allow wrapping */
		gap: 1rem;
		background: var(--bg);
		padding: 1rem;
		border-radius: 0.5rem;
		align-items: center;
		justify-content: center;
		width: fit-content;
		max-width: calc(3 * 2.5rem + 3 * 1rem + 2rem); /* 4 icons + 3 gaps + padding */
	}
	.stack-icons p {
		font-size: 0.9em;
		color: var(--outline);
	}
	.icon {
		position: relative;
	}
	.icon::after {
		content: attr(data-label);
		position: absolute;
		left: 50%;
		bottom: 125%;
		transform: translateX(-50%);
		background: var(--bg);
		color: var(--accent);
		font-family: 'Fira Code', monospace;
		font-size: 0.95em;
		padding: 5px 12px;
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		opacity: 0;
		white-space: nowrap;
		z-index: 10;
		transition: opacity 0.2s;
		visibility: hidden;
	}
	.icon:hover::after,
	.icon:focus::after {
		opacity: 1;
		visibility: visible;
	}
</style>
