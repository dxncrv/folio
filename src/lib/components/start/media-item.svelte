<script lang="ts">
	import type { Media } from '$lib/types';

	interface Props {
		media: Media;
		isEditing: boolean;
		editForm: Partial<Media>;
		onStartEdit: () => void;
		onSaveEdit: () => void;
		onCancelEdit: () => void;
		onDelete: () => void;
		onInsert: () => void;
		onFieldChange: (field: keyof Media, value: any) => void;
	}

	let { 
		media, 
		isEditing, 
		editForm, 
		onStartEdit, 
		onSaveEdit, 
		onCancelEdit, 
		onDelete, 
		onInsert,
		onFieldChange 
	}: Props = $props();

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSaveEdit();
	}

	function handleTagsInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const tags = input.value.split(',').map(t => t.trim()).filter(Boolean);
		onFieldChange('tags', tags);
	}
</script>

<div class="media-item">
	<div class="media-header">
		<div class="media-name">{media.path.split('/').pop()}</div>
		<div class="media-actions" class:editing={isEditing}>
			{#if isEditing}
				<button class="save" type="button" onclick={onSaveEdit} aria-label="Save media changes">
					<iconify-icon icon="line-md:check-all" width="16" height="16"></iconify-icon>
				</button>
				<button class="cancel" type="button" onclick={onCancelEdit} aria-label="Cancel media editing">
					<iconify-icon icon="line-md:cancel" width="16" height="16"></iconify-icon>
				</button>
			{:else}
				<button class="insert" onclick={onInsert} aria-label="Insert media item">
					<iconify-icon icon="line-md:rotate-180" width="16" height="16"></iconify-icon>
				</button>
				<button class="delete" onclick={onDelete} aria-label="Delete media item">
					<iconify-icon icon="line-md:remove" width="16" height="16"></iconify-icon>
				</button>
				<button class="edit" onclick={onStartEdit} aria-label="Edit media item">
					<iconify-icon icon="line-md:edit-twotone" width="16" height="16"></iconify-icon>
				</button>
			{/if}
		</div>
	</div>
	
	<div class="media-preview">
		{#if media.type === 'image'}
			<img src="/{media.path}" alt={media.alt || media.id} />
		{:else}
			<video muted>
				<source src="/{media.path}" type="video/{media.path.split('.').pop()}" />
				<track kind="captions" />
			</video>
		{/if}
	</div>

	{#if isEditing}
		<form onsubmit={handleSubmit} class="edit-form">
			<div class="edit-fields">
				<input 
					class="field" 
					bind:value={editForm.alt} 
					placeholder="Alt text" 
					oninput={(e) => onFieldChange('alt', (e.target as HTMLInputElement).value)}
				/>
				<input 
					class="field" 
					bind:value={editForm.caption} 
					placeholder="Caption"
					oninput={(e) => onFieldChange('caption', (e.target as HTMLInputElement).value)}
				/>
				<input 
					class="field" 
					value={editForm.tags?.join(', ') || ''} 
					placeholder="Tags (comma-separated)"
					oninput={handleTagsInput}
				/>
			</div>
		</form>
	{/if}
</div>

<style>
	.media-item {
		border-radius: 0.5rem;
		background: var(--bg);
		padding: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.media-header {
		display: flex;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.media-name {
		flex: 1;
		font-size: 0.9rem;
		font-family: var(--font-ui);
		color: var(--contrast);
		word-break: break-word;
	}

	.media-actions {
		display: flex;
	}

	.media-actions > button {
		background: var(--font-dim);
		padding: 0.35rem 0.75rem;
		border: 2px solid transparent;
		cursor: pointer;
	}

	.media-actions > button:first-child {
		border-top-left-radius: 0.5rem;
		border-bottom-left-radius: 0.5rem;
	}

	.media-actions > button:last-child {
		border-top-right-radius: 0.5rem;
		border-bottom-right-radius: 0.5rem;
	}

	.media-actions > button:only-child {
		border-radius: 0.5rem;
	}

	.media-actions.editing {
		outline: 2px solid hsl(220, 100%, 50%);
		outline-offset: 2px;
		border-radius: 0.5rem;
	}

	.edit {
		background: none;
		color: var(--accent);
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}

	.edit:hover {
		color: var(--accent);
		border: 2px solid var(--accent);
		background: var(--bg);
	}

	.delete {
		background: none;
		color: #ff6b6b;
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}

	.delete:hover {
		color: #ff6b6b;
		border: 2px solid #ff6b6b;
		background: var(--bg);
	}

	.insert {
		background: none;
		color: var(--accent-dim);
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}

	.insert:hover {
		color: var(--accent-dim);
		border: 2px solid var(--accent-dim);
		background: var(--bg);
	}

	.save {
		background: none;
		color: var(--accent);
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}

	.save:hover {
		color: var(--accent);
		border: 2px solid var(--accent);
		background: var(--bg);
	}

	.cancel {
		background: none;
		color: #ff9800;
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}

	.cancel:hover {
		color: #ff9800;
		border: 2px solid #ff9800;
		background: var(--bg);
	}

	.media-preview {
		width: 100%;
		height: 120px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: black;
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.media-preview img, 
	.media-preview video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.edit-form {
		margin-top: 0.5rem;
	}

	.edit-fields {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		background: black;
		border-radius: 0.5rem;
		padding: 0.25rem;
	}

	.field {
		background: black;
		border: none;
		outline: none;
		padding: 0.4rem 0.5rem;
		font-family: 'Fira Code', monospace;
		font-size: 0.8rem;
		color: aliceblue;
		border-radius: 0.25rem;
	}

	.field:focus {
		color: var(--accent);
	}
</style>