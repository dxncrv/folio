<script lang="ts">
	import { MediaStore } from '$lib/store.svelte';
	import type { Media } from '$lib/types';
	import MediaItem from './media-item.svelte';

	let editingId = $state<string | null>(null);
	let editForm = $state<Partial<Media>>({});
	let isCollapsed = $state(true);

	$effect(() => {
		MediaStore.fetchMedia();
	});

	const mediaActions = {
		startEdit: (media: Media) => {
			editingId = media.id;
			editForm = { ...media };
		},

		cancelEdit: () => {
			editingId = null;
			editForm = {};
		},

		saveEdit: async () => {
			if (!editForm.id) return;
			try {
				await MediaStore.updateMediaItem(editForm as Media);
				editingId = null;
				editForm = {};
			} catch (err) {
				console.error('Failed to update media:', err);
			}
		},

		deleteMedia: async (id: string) => {
			if (confirm('Are you sure you want to delete this media item?')) {
				try {
					await MediaStore.deleteMediaItem(id);
				} catch (err) {
					console.error('Failed to delete media:', err);
				}
			}
		},

		insertIntoMarkdown: (media: Media) => {
			const event = new CustomEvent('insert-media', { detail: media });
			window.dispatchEvent(event);
		},

		updateField: (field: keyof Media, value: any) => {
			editForm[field] = value;
		}
	};

	async function scanMedia() {
		try {
			await MediaStore.scanMedia();
		} catch (err) {
			console.error('Failed to scan media:', err);
		}
	}
</script>

<div class="media-sidebar" class:collapsed={isCollapsed}>
	<header class="sidebar-actions">
		<button class="icon-btn" onclick={() => isCollapsed = !isCollapsed}>
			{#if isCollapsed} 
			<iconify-icon icon= "line-md:image-twotone" width="20" height="20"></iconify-icon>
			{:else} <iconify-icon icon= "line-md:close" width="20" height="20"></iconify-icon>
			{/if}
		</button>
		{#if !isCollapsed}
		<h3>Media Library</h3>
		<button class="icon-btn" onclick={scanMedia} disabled={MediaStore.loading}>
			{MediaStore.loading ? '⟳' : '↻'}
		</button>{/if}
	</header>

	{#if !isCollapsed}
		<div class="sidebar-content">

			{#if MediaStore.error}
				<p class="error">{MediaStore.error}</p>
			{/if}

			<div class="media-list">
				{#each MediaStore.all as media (media.id)}
					<MediaItem 
						{media}
						isEditing={editingId === media.id}
						{editForm}
						onStartEdit={() => mediaActions.startEdit(media)}
						onSaveEdit={mediaActions.saveEdit}
						onCancelEdit={mediaActions.cancelEdit}
						onDelete={() => mediaActions.deleteMedia(media.id)}
						onInsert={() => mediaActions.insertIntoMarkdown(media)}
						onFieldChange={mediaActions.updateField}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	header h3 {
		font-family: var(--font-ui);
		color: var(--accent);
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}
	.media-sidebar {
		position: fixed;
		top: 0;
		right: 0;
		height: 100vh;
		width: 320px;
		background: var(--bg);
		border-left: 1px solid var(--outline);
		display: flex;
		flex-direction: column;
		z-index: 1000;
		transition: width 0.3s ease;
		box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
	}

	.media-sidebar.collapsed {
		width: 48px;
	}

	.sidebar-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem;
		border-bottom: 1px solid var(--outline);
	}

	.media-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5rem;
		align-items: start;
	}

	.error {
		color: #ff6b6b;
		font-size: 0.8rem;
		padding: 0.5rem;
		text-align: center;
	}

	@media (max-width: 768px) {
		.media-sidebar { width: 280px; }
		.media-sidebar.collapsed { width: 68px; }
		.media-list { grid-template-columns: 1fr; }
	}
</style>
