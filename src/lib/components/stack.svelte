<style>
	.stack-icons {
		display: flex;
		gap: 1rem;
		background: var(--bg);
		padding: 1rem;
		border-radius: 0.5rem;
		align-items: center;
		width: fit-content;
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

<script lang="ts">
// Array of stack items with icon name and label
const stack = [
    { icon: 'material-icon-theme:svelte', label: 'Svelte' },
    { icon: 'vscode-icons:file-type-typescript', label: 'TypeScript' },
    { icon: 'material-icon-theme:react', label: 'React' },
    { icon: 'vscode-icons:file-type-csharp', label: 'C#' },
    { icon: 'material-icon-theme:python', label: 'Python' }
];
</script>

<main class="stack-icons">
	{#each stack as { icon, label } }
		<iconify-icon class="icon" {icon} height="18px" width="18px" data-label={label} aria-label={label}></iconify-icon>
	{/each}
</main>