
<script lang="ts">
	import { onMount } from 'svelte';
	import { Projects } from '$lib/store.svelte';
	import ProjectForm from '$lib/components/ProjectForm.svelte';
	import type { Project } from '$lib/types';
	import Typer from '$lib/_libfx/Typer.svelte';

	let showForm = $state(false);
	let editingProject = $state<Project | undefined>(undefined);
	let formMode = $state<'create' | 'edit'>('create');
	let message = $state<string>('');
	let messageType = $state<'success' | 'error' | 'info' | ''>('');
	let editingProjectId = $state<string | null>(null);
	let editingJson = $state('');

	onMount(async () => {
		await Projects.fetchProjects();
	});

	function showCreateForm() {
		editingProject = undefined;
		formMode = 'create';
		showForm = true;
	}

	function showEditForm(project: Project) {
		editingProjectId = project.title;
		editingJson = JSON.stringify(project, null, 2);
		showMessage(`Editing "${project.title}"`, 'info');
	}

	function cancelEditing() {
		editingProjectId = null;
	}

	async function saveEditing(originalTitle: string, json: string) {
		try {
			const project = JSON.parse(json);
			await Projects.updateProject(originalTitle, project);
			showMessage('Project updated successfully!', 'success');
			editingProjectId = null;
		} catch (error) {
			showMessage('Invalid JSON: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
		}
	}

	function hideForm() {
		showForm = false;
		editingProject = undefined;
	}

	async function handleProjectSubmit(project: Project) {
		try {
			if (formMode === 'create') {
				await Projects.addProject(project);
				showMessage('Project created successfully!', 'success');
			} else if (editingProject) {
				await Projects.updateProject(editingProject.title, project);
				showMessage('Project updated successfully!', 'success');
			}
			hideForm();
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'An error occurred', 'error');
		}
	}

	async function handleDeleteProject(title: string) {
		if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
		
		try {
			await Projects.deleteProject(title);
			showMessage('Project deleted successfully!', 'success');
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'An error occurred', 'error');
		}
	}

	function showMessage(msg: string, type: 'success' | 'error' | 'info') {
		message = msg;
		messageType = type;
		setTimeout(() => {
			message = '';
			messageType = '';
		}, 3000);
	}

</script>

<main>
	<header>
		<a href="/" class="logo">
			<img src="/favicon.png" alt="Logo" />
		</a>
		<h1>Hello, Aash.</h1>
		<p class="header-message {messageType}">
			<Typer text={message || "Welcome to the start page."}/>
		</p>
		<button class="primary" onclick={showCreateForm}>
			+ Create New Project
		</button>
	</header>

	{#if Projects.loading}
		<div class="loading">Loading projects...</div>
	{:else if Projects.error}
		<div class="error">Error: {Projects.error}</div>
	{:else}
		<div class="projects-grid">
			{#each Projects.all as project}
				<div class="project-card">
					<div class="project-header">
						<h3>{project.title}</h3>
						<div class="project-actions" class:editing={editingProjectId === project.title}>
							{#if editingProjectId === project.title}
								<button class="save" onclick={() => saveEditing(project.title, editingJson)} aria-label="Save project">
									<iconify-icon icon="line-md:uploading-loop" width="16" height="16"></iconify-icon>
								</button>
								<button class="cancel" onclick={cancelEditing} aria-label="Cancel edit">
									<iconify-icon icon="line-md:cancel" width="16" height="16"></iconify-icon>
								</button>
							{:else}
								<button class="edit" onclick={() => showEditForm(project)} aria-label="Edit project">
									<iconify-icon icon="line-md:edit-twotone" width="16" height="16" ></iconify-icon>
								</button>
								<button class="delete" onclick={() => handleDeleteProject(project.title)} aria-label="Delete project">
									<iconify-icon icon="line-md:remove" width="16" height="16"></iconify-icon>
								</button>
							{/if}
						</div>
					</div>
					<div class="project-json">
						{#if editingProjectId === project.title}
							<textarea class="fira-code-normal" style="color: var(--accent);" bind:value={editingJson}></textarea>
						{:else}
							<pre class="fira-code-normal" style="color: aliceblue;">{JSON.stringify(project, null, 2)}</pre>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if Projects.all.length === 0}
			<div class="empty-state">
				<h3>No projects yet</h3>
				<p>Create your first project to get started!</p>
				<button class="create-btn" onclick={showCreateForm}>
					Create Your First Project
				</button>
			</div>
		{/if}
	{/if}

	{#if showForm}
		<div 
			tabindex="0"
			class="modal-overlay" 
			role="dialog" 
			aria-modal="true"
			onclick={(e) => e.target === e.currentTarget && hideForm()}
			onkeydown={(e) => e.key === 'Escape' && hideForm()}
		>
			<div class="modal-content">
				<ProjectForm 
					project={editingProject}
					mode={formMode}
					onsubmit={handleProjectSubmit}
					oncancel={hideForm}
				/>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		gap: 2rem;
	}

	.logo {
		position: fixed;
		left: 2rem;
		display: flex;
		align-items: center;
		height: 1rem;
	}
	.logo img {
		height: 3rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		color: var(--accent);
		font-family: var(--font-ui);
	}

	.header-message {
		font-family: var(--font-ui);
		margin: 0.5rem 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.header-message.success {
		color: var(--accent);
	}

	.header-message.error {
		color: #ff6b6b;
	}

	.header-message.info {
		color: var(--contrast);
	}

	.loading, .error {
		text-align: center;
		padding: 2rem;
		font-size: 1.1rem;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 0.5rem;
		padding: 0.5rem;
	}
	.project-header {
		display: flex;
		align-items: center;
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
	.project-card {
		border-radius: 0.5rem;
		background: var(--bg);
		padding: 0.5rem;
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
	.save:hover {
		color: var(--accent);
		border: 2px solid var(--accent);
		background: var(--bg);
	}
	.cancel {
		background: none;
		color: #ff6b6b;
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}
	.cancel:hover {
		color: #ff6b6b;
		border: 2px solid #ff6b6b;
		background: var(--bg);
	}

	.project-meta {
		margin-bottom: 1rem;
	}

	.project-status-wrapper {
		margin-bottom: 0.75rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.tag {
		background: var(--accent);
		color: var(--bg);
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		border: 2px solid var(--accent);
		box-shadow: 2px 2px 0 var(--accent-dim);
	}

	.project-links {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.project-desc, .project-tech, .project-awards {
		margin-bottom: 1rem;
	}

	.desc-section, .tech-section {
		margin-bottom: 1rem;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--font-color);
		font-family: var(--font-read);
	}

	.tech-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.tech-item {
		background: var(--bg);
		color: var(--contrast);
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		border: 2px solid var(--outline);
		box-shadow: 2px 2px 0 var(--font-dim);
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--font-color);
		background: var(--bg);
		border: 3px solid var(--outline);
		box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.3);
	}

	.empty-state h3 {
		margin: 0 0 1rem 0;
		color: var(--contrast);
		font-family: var(--font-ui);
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 2rem;
	}

	.empty-state p {
		font-family: var(--font-read);
		font-size: 1.1rem;
		margin-bottom: 2rem;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 2rem;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: var(--bg);
		border: 3px solid var(--accent);
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 12px 12px 0 var(--accent-dim);
	}
</style>