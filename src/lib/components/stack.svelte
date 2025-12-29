<script lang="ts">
// Tech stack and tools
const stack = {
	'Excalidraw': 'material-icon-theme:excalidraw',
	'Figma': 'material-icon-theme:figma',
	'Svelte': 'material-icon-theme:svelte',
	'TypeScript': 'vscode-icons:file-type-typescript',
	'C Sharp': 'material-icon-theme:csharp',
	'Python': 'material-icon-theme:python',
	'Redis': 'devicon:redis',
};
</script>

<main class="stack-icons">
	{#each Object.entries(stack) as [label, icon]}
		<iconify-icon class="icon" {icon} height="18px" width="18px" data-label={label} aria-label={label}></iconify-icon>
	{/each} 
	<p>..and more</p> 
</main>

<style>
	.stack-icons {
		display: flex;
		flex-wrap: wrap; 
		gap: 1rem;
		background: var(--bg);
		padding: 1rem;
		border-radius: 0.5rem;
		align-items: center;
		justify-content: center;
		width: fit-content;
		max-width: calc(3 * 2.5rem + 3 * 1rem + 2rem);
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
		box-shadow: 0 2px 8px rgba(0,0,0,0.12);
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