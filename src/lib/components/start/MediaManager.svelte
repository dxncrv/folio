<script lang="ts">
	import { MediaStore } from '$lib/store.svelte';
	import type { Media } from '$lib/types';

	let editingId = $state<string | null>(null);
	let editForm = $state<Partial<Media>>({});

	$effect(() => {
		MediaStore.fetchMedia();
	});

	function startEdit(media: Media) {
		editingId = media.id;
		editForm = { ...media };
	}

	function cancelEdit() {
		editingId = null;
		editForm = {};
	}

	async function saveEdit() {
		if (!editForm.id) return;
		try {
			await MediaStore.updateMediaItem(editForm as Media);
			editingId = null;
			editForm = {};
		} catch (err) {
			console.error('Failed to update media:', err);
		}
	}

function handleFormSubmit(e: Event) {
	e.preventDefault();
	// call saveEdit (async) but don't await here in template handler
	void saveEdit();
}

	async function deleteMedia(id: string) {
		if (confirm('Are you sure you want to delete this media item?')) {
			try {
				await MediaStore.deleteMediaItem(id);
			} catch (err) {
				console.error('Failed to delete media:', err);
			}
		}
	}

	async function scanMedia() {
		try {
			await MediaStore.scanMedia();
		} catch (err) {
			console.error('Failed to scan media:', err);
		}
	}

	function insertIntoMarkdown(media: Media) {
		// Dispatch custom event for markdown editor integration
		const event = new CustomEvent('insert-media', { detail: media });
		window.dispatchEvent(event);
	}
</script>

<div class="media-manager">
	<h2>Media Management</h2>
	<button onclick={scanMedia} disabled={MediaStore.loading}>
		{MediaStore.loading ? 'Scanning...' : 'Scan Static Folder'}
	</button>

	{#if MediaStore.error}
		<p class="error">{MediaStore.error}</p>
	{/if}

	<div class="media-grid">
		{#each MediaStore.all as media (media.id)}
			<div class="media-item">
				{#if media.type === 'image'}
					<img src="/{media.path}" alt={media.alt || media.id} />
				{:else}
					<video controls>
						<source src="/{media.path}" type="video/{media.path.split('.').pop()}" />
                        <track kind="captions" />
					</video>
				{/if}

				{#if editingId === media.id}
					<form onsubmit={handleFormSubmit} class="project-card edit-form">
						<div class="project-header">
							<h3>Edit Media</h3>
							<div class="project-actions editing">
								<button class="save" type="submit" aria-label="Save media">
									Save
								</button>
								<button class="cancel" type="button" onclick={cancelEdit} aria-label="Cancel edit">
									Cancel
								</button>
							</div>
						</div>
						<div class="project-json edit-fields">
							<label>
								Alt Text
								<input class="field" bind:value={editForm.alt} type="text" />
							</label>
							<label>
								Caption
								<input class="field" bind:value={editForm.caption} type="text" />
							</label>
							<label>
								Tags (comma-separated)
								<input class="field" bind:value={editForm.tags} type="text" oninput={(e) => editForm.tags = (e.target as HTMLInputElement).value.split(',').map(t => t.trim())} />
							</label>
						</div>
					</form>
				{:else}
					<div class="media-info">
						<p><strong>Path:</strong> {media.path}</p>
						<p><strong>Alt:</strong> {media.alt || 'None'}</p>
						<p><strong>Caption:</strong> {media.caption || 'None'}</p>
						<p><strong>Tags:</strong> {media.tags?.join(', ') || 'None'}</p>
					</div>
					<div class="actions">
						<button class="edit" onclick={() => startEdit(media)}>Edit</button>
						<button class="save" onclick={() => insertIntoMarkdown(media)}>Insert</button>
						<button class="delete" onclick={() => deleteMedia(media.id)}>Delete</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.media-manager {
		padding: 1rem;
	}

	/* Feed-style layout: items flow vertically, creating columns as space allows */
	.media-grid {
		/* Let the browser create as many columns as fit given the column width */
		column-width: 320px;
		column-gap: 1rem;
		margin-top: 1rem;
		/* Ensure vertical scrolling space expands naturally */
		width: 100%;
	}

	.media-item {
		display: inline-block; /* required for column flow */
		width: 100%;
		box-sizing: border-box;
		margin: 0 0 1rem 0; /* vertical spacing between items */
		border: 1px solid #ccc;
		padding: 1rem;
		border-radius: 8px;
		background: var(--body-bg, #fff);
		/* prevent items from being split between columns */
		break-inside: avoid;
		-webkit-column-break-inside: avoid;
		page-break-inside: avoid;
	}

	.media-item img, .media-item video {
		max-width: 100%;
		height: auto;
	}

	.media-info {
		margin-top: 0.5rem;
	}

	.actions {
		margin-top: 0.5rem;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	button {
		padding: 0.5rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:hover {
		background: #0056b3;
	}

	button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.error {
		color: red;
	}

	/* Match admin /start button and card styles */
	.project-card {
		border-radius: 0.5rem;
		background: var(--bg);
		padding: 0.5rem;
		border: 1px solid var(--outline);
	}
	.project-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.project-header h3 {
		margin: 0;
		font-family: var(--font-ui);
		color: var(--contrast);
		font-size: 0.95rem;
	}
	.project-actions { display:flex; gap:0.5rem }
	.project-actions > button {
		background: var(--font-dim);
		padding: 0.35rem 0.75rem;
		border: 2px solid transparent;
		cursor: pointer;
	}
	.project-actions.editing {
		outline: 2px solid hsl(220, 100%, 50%);
		outline-offset: 2px;
		border-radius: 0.5rem;
	}
	.edit { background: none; color: var(--accent); padding: 0.5rem 1rem; border: 2px solid var(--outline); }
	.delete { background: none; color: #ff6b6b; padding: 0.5rem 1rem; border: 2px solid var(--outline); }
	.save { background: none; color: var(--accent); padding: 0.5rem 1rem; border: 2px solid var(--outline); }
	.cancel { background: none; color: #ff9800; padding: 0.5rem 1rem; border: 2px solid var(--outline); }

	/* Edit form specific */
	.edit-form { display: flex; flex-direction: column; gap: 0.5rem; }
	.edit-fields { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.5rem; }
	.edit-fields label { display:flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; }
	.field { padding: 0.4rem 0.5rem; border-radius: 4px; border: 1px solid var(--outline); background: var(--bg); }
</style>
