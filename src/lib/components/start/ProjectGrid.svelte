<script lang="ts">
import type { Project } from '$lib/types';
import { slugify } from '$lib/formatting';
import ProjectCard from './ProjectCard.svelte';

interface Props {
	projects: Project[];
	editingProjectId: string | null;
	editingJson: string;
	isCreatingNew: boolean;
	newProjectJson: string;
	caseStudyContents: Record<string, string>;
	onEdit: (project: Project) => void;
	onSave: (originalTitle: string, json: string) => void;
	onCancel: () => void;
	onDelete: (title: string) => void;
	onCreateForm: () => void;
	onSaveNew: (json: string) => void;
	onCancelNew: () => void;
}

let {
	projects,
	editingProjectId,
	editingJson,
	isCreatingNew,
	newProjectJson,
	caseStudyContents,
	onEdit,
	onSave,
	onCancel,
	onDelete,
	onCreateForm,
	onSaveNew,
	onCancelNew
}: Props = $props();
</script>

<div class="projects-grid">
	{#each projects as project}
		<ProjectCard
			{project}
			{editingProjectId}
			{editingJson}
			caseStudyContent={caseStudyContents[slugify(project.title)] || ''}
			{onEdit}
			{onSave}
			{onCancel}
			{onDelete}
		/>
	{/each}

	<!-- New Project Card in Edit Mode -->
	{#if isCreatingNew}
		<div class="project-card">
			<div class="project-header">
				<h3>New Project</h3>
				<div class="project-actions editing">
					<button class="save" onclick={() => onSaveNew(newProjectJson)} aria-label="Save new project">
						<iconify-icon icon="line-md:uploading-loop" width="16" height="16"></iconify-icon>
					</button>
					<button class="cancel" onclick={onCancelNew} aria-label="Cancel create">
						<iconify-icon icon="line-md:cancel" width="16" height="16"></iconify-icon>
					</button>
				</div>
			</div>
			<div class="project-json">
				<textarea class="fira-code-normal" style="color: var(--accent);" bind:value={newProjectJson}></textarea>
			</div>
		</div>
	{:else}
		<!-- Create New Project Button -->
		<button class="create-project-card" onclick={onCreateForm}>
			<iconify-icon icon="line-md:plus" width="24" height="24"></iconify-icon>
			<span>Create New Project</span>
		</button>
	{/if}
</div>

<style>
	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 0.5rem;
		padding: 0.5rem;
	}
	.project-card {
		border-radius: 0.5rem;
		background: var(--bg);
		padding: 0.5rem;
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
	.project-json {
		height: 8rem;
		overflow-y: auto;
		background: black;
		border-radius: 0.5rem;
		padding: 0.25rem;
		margin-top: 0.5rem;
		font-size: 0.8rem;
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
	.create-project-card {
		border-radius: 0.5rem;
		background: var(--bg);
		padding: 2rem;
		border: 2px dashed var(--outline);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 10rem;
		cursor: pointer;
		transition: all 0.3s ease;
		color: var(--font-color);
		font-family: var(--font-ui);
		font-size: 1rem;
	}
	.create-project-card:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--bg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	.create-project-card iconify-icon {
		opacity: 0.7;
		transition: opacity 0.3s ease;
	}
	.create-project-card:hover iconify-icon {
		opacity: 1;
	}
</style>
