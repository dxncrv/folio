<script lang="ts">
import type { Project } from '$lib/types';
import { slugify } from '$lib/formatting';
import ProjectCard from './project-card.svelte';

interface Props {
	projects: Project[];
	caseStudyContents: Record<string, string>;
	onSave: (originalTitle: string, updatedProject: Project) => Promise<void>;
	onDelete: (title: string) => Promise<void>;
	onCreateNew: () => void;
	onSaveNew: (project: Project) => Promise<void>;
}

let {
	projects,
	caseStudyContents,
	onSave,
	onDelete,
	onCreateNew,
	onSaveNew
}: Props = $props();

// Expand/collapse state using Svelte 5 $state rune
let isExpanded = $state(true); // Default to expanded for better UX

// Derived project count
let projectCount = $derived(projects.length);

function toggleExpand() {
	isExpanded = !isExpanded;
}

// Local state for new project creation
let isCreatingNew = $state(false);
let newProjectJson = $state('');
let isSavingNew = $state(false);

function showCreateForm() {
	const template = {
		"title": "New Project",
		"tags": ["Design"],
		"image": "ph",
		"link": "",
		"git": "",
		"yt": "",
		"awards": [],
		"desc": {
			"code": "",
			"design": "Description here"
		},
		"tech": {
			"code": [],
			"design": []
		},
		"study": {}
	};
	newProjectJson = JSON.stringify(template, null, 2);
	isCreatingNew = true;
	onCreateNew();
}

function cancelCreating() {
	isCreatingNew = false;
	newProjectJson = '';
}

async function saveNewProject() {
	if (isSavingNew) return;
	isSavingNew = true;
	try {
		const project = JSON.parse(newProjectJson);
		await onSaveNew(project);
		isCreatingNew = false;
		newProjectJson = '';
	} catch (error) {
		alert('Invalid JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
	} finally {
		isSavingNew = false;
	}
}
</script>

<section class="projects-container" class:expanded={isExpanded}>
	<header onclick={toggleExpand} onkeydown={(e) => e.key === 'Enter' && toggleExpand()} role="button" tabindex="0">
		<h2>
			<iconify-icon icon="carbon:catalog" width="20" height="20"></iconify-icon>
			Projects ({projectCount})
		</h2>
		<button class="toggle-btn" onclick={(e) => { e.stopPropagation(); toggleExpand(); }} aria-label="Toggle projects grid">
			<iconify-icon 
				icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
				width="20" 
				height="20"
			></iconify-icon>
		</button>
	</header>

	{#if isExpanded}
		<div class="projects-grid">
	{#each projects as project (project.title)}
		<ProjectCard
			{project}
			caseStudyContent={caseStudyContents[slugify(project.title)] || ''}
			{onSave}
			{onDelete}
		/>
	{/each}

	<!-- New Project Card in Edit Mode -->
	{#if isCreatingNew}
		<div class="project-card new-project">
			<div class="project-header">
				<h3>New Project</h3>
				<div class="project-actions editing">
					<button class="save" onclick={saveNewProject} disabled={isSavingNew} aria-label="Save new project">
						<iconify-icon icon={isSavingNew ? "line-md:loading-loop" : "line-md:uploading-loop"} width="16" height="16"></iconify-icon>
					</button>
					<button class="cancel" onclick={cancelCreating} disabled={isSavingNew} aria-label="Cancel create">
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
		<button class="create-project-card" onclick={showCreateForm}>
			<iconify-icon icon="line-md:plus" width="24" height="24"></iconify-icon>
			<span>Create New Project</span>
		</button>
	{/if}
		</div>
	{/if}
</section>

<style>
	.projects-container {
		border-radius: 0.5rem;
		background: var(--bg);
		overflow: hidden;
		margin-bottom: 2rem;
	}

	.projects-container.expanded {
		box-shadow: 0 4px 12px rgba(0,0,0,0.04);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--font-dim);
		cursor: pointer;
		user-select: none;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		font-family: var(--font-ui);
		font-size: 1.2rem;
		color: var(--contrast);
	}

	.toggle-btn {
		background: none;
		border: none;
		color: var(--contrast);
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: 0.25rem;
		transition: color 0.2s ease;
	}

	.toggle-btn:hover {
		color: var(--accent);
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 0.5rem;
		padding: 1rem;
	}
	.project-card {
		border-radius: 0.5rem;
		background: var(--bg);
		padding: 0.5rem;
		transition: all 0.2s ease;
	}
	.project-card.new-project {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
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
