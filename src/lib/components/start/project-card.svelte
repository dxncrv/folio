<script lang="ts">
import type { Project } from '$lib/types';
import { deriveSlug } from '$lib';
import Editor from '$lib/components/editor.svelte';

interface Props {
	project: Project;
	caseStudyContent: string;
	onSave: (originalTitle: string, updatedProject: Project) => Promise<void>;
	onDelete: (title: string) => Promise<void>;
}

let { project, caseStudyContent, onSave, onDelete }: Props = $props();

// Local editing state - each card manages its own edit mode
let isEditing = $state(false);
let editingJson = $state('');
let isSaving = $state(false);

function startEdit() {
	isEditing = true;
	editingJson = JSON.stringify(project, null, 2);
}

function cancelEdit() {
	isEditing = false;
	editingJson = '';
}

async function saveEdit() {
	if (isSaving) return;
	isSaving = true;
	try {
		const updatedProject = JSON.parse(editingJson);
		await onSave(project.title, updatedProject);
		isEditing = false;
		editingJson = '';
	} catch (error) {
		alert('Invalid JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
	} finally {
		isSaving = false;
	}
}

async function handleDelete() {
	if (isSaving) return;
	if (!confirm(`Are you sure you want to delete "${project.title}"?`)) return;
	isSaving = true;
	try {
		await onDelete(project.title);
	} finally {
		isSaving = false;
	}
}
</script>

<div class="project-card" class:editing={isEditing}>
	<div class="project-header">
		<div class="project-status">
			<span class="status-circle" class:live={caseStudyContent} class:local={!caseStudyContent}></span>
		</div>
		<h3>{project.title}</h3>
		<div class="project-actions" class:editing={isEditing}>
			{#if isEditing}
				<button class="save" onclick={saveEdit} disabled={isSaving} aria-label="Save project">
					<iconify-icon icon={isSaving ? "line-md:loading-loop" : "line-md:uploading-loop"} width="16" height="16"></iconify-icon>
				</button>
				<button class="cancel" onclick={cancelEdit} disabled={isSaving} aria-label="Cancel edit">
					<iconify-icon icon="line-md:cancel" width="16" height="16"></iconify-icon>
				</button>
			{:else}
				<button class="delete" onclick={handleDelete} disabled={isSaving} aria-label="Delete project">
					<iconify-icon icon={isSaving ? "line-md:loading-loop" : "line-md:remove"} width="16" height="16"></iconify-icon>
				</button>
				<button class="edit" onclick={startEdit} aria-label="Edit project">
					<iconify-icon icon="line-md:edit-twotone" width="16" height="16" ></iconify-icon>
				</button>
			{/if}
		</div>
	</div>
	<div class="project-json">
		{#if isEditing}
			<textarea class="fira-code-normal" style="color: var(--accent);" bind:value={editingJson}></textarea>
		{:else}
			<pre class="fira-code-normal" style="color: aliceblue;">{JSON.stringify(project, null, 2)}</pre>
		{/if}
	</div>
	<Editor
		initialContent={caseStudyContent || ''}
		slug={deriveSlug(project)}
	/>
</div>

<style>
	.project-card {
		border-radius: 0.5rem;
		background: var(--bg);
		padding: 0.5rem;
		transition: all 0.2s ease;
	}
	.project-header {
		display: flex;
		align-items: center;
	}
	.project-header h3 {
		color: var(--contrast);
		flex: 1;
		font-family: var(--font-ui);
		margin-left: 1rem;
		font-size: 1rem;
	}
	.project-status {
		margin-left: 1rem;
	}
	.project-status .live {
		background-color: #4caf50;
	}
	.project-status .local {
		background-color: #ff9800;
	}
	.status-circle {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}
	@keyframes pulse {
		0% { opacity: 1; }
		50% { opacity: 0.5; }
		100% { opacity: 1; }
	}
	.project-actions {
		display: flex;
	}
	.project-actions > button {
		background: var(--font-dim);
		padding: 0.35rem 0.75rem;
		border: 2px solid transparent;
	}
	.project-actions > button:first-child {
		border-top-left-radius: 0.5rem;
		border-bottom-left-radius: 0.5rem;
	}
	.project-actions > button:last-child {
		border-top-right-radius: 0.5rem;
		border-bottom-right-radius: 0.5rem;
	}
	.project-actions > button:only-child {
		border-radius: 0.5rem;
	}
	.project-actions.editing {
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
	.save {
		background: none;
		color: var(--accent);
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}
	.save:hover:not(:disabled) {
		color: var(--accent);
		border: 2px solid var(--accent);
		background: var(--bg);
	}
	.save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.cancel {
		background: none;
		color: #ff9800;
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}
	.cancel:hover:not(:disabled) {
		color: #ff9800;
		border: 2px solid #ff9800;
		background: var(--bg);
	}
	.cancel:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.project-json {
		height: 8rem;
		overflow-y: auto;
		background: black;
		border-radius: 0.5rem;
		padding: 0.25rem;
		margin-top: 0.5rem;
		font-size: 0.8rem;
	}
	.project-json pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}
	.project-json textarea {
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
		background: black;
		border: none;
		outline: none;
		resize: none;
		width: 100%;
		height: 100%;
		font-family: 'Fira Code', monospace;
		font-size: 0.8rem;
		color: aliceblue;
	}
</style>
