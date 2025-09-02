
<script lang="ts">
	import { onMount } from 'svelte';
	import { Projects } from '$lib/store.svelte';
	import ProjectForm from '$lib/components/ProjectForm.svelte';
	import type { Project } from '$lib/types';

	let showForm = $state(false);
	let editingProject = $state<Project | undefined>(undefined);
	let formMode = $state<'create' | 'edit'>('create');
	let message = $state<string>('');
	let messageType = $state<'success' | 'error' | ''>('');
	let searchTerm = $state<string>('');
	let selectedTagFilter = $state<string>('');

	// Derived state for filtered projects
	let filteredProjects = $derived.by(() => {
		let filtered = Projects.all;
		
		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter(project => 
				project.title.toLowerCase().includes(search) ||
				project.desc.code?.toLowerCase().includes(search) ||
				project.desc.design?.toLowerCase().includes(search)
			);
		}
		
		if (selectedTagFilter) {
			filtered = filtered.filter(project => 
				project.tags.includes(selectedTagFilter)
			);
		}
		
		return filtered;
	});

	// Get unique tags for filter dropdown
	let availableTags = $derived.by(() => {
		const allTags = Projects.all.flatMap(project => project.tags);
		return Array.from(new Set(allTags)).sort();
	});

	onMount(async () => {
		await Projects.fetchProjects();
	});

	function showCreateForm() {
		editingProject = undefined;
		formMode = 'create';
		showForm = true;
	}

	function showEditForm(project: Project) {
		editingProject = project;
		formMode = 'edit';
		showForm = true;
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

	function showMessage(msg: string, type: 'success' | 'error') {
		message = msg;
		messageType = type;
		setTimeout(() => {
			message = '';
			messageType = '';
		}, 5000);
	}

	async function handleInitFromJson() {
		if (!confirm('This will replace all existing projects with data from projects.json. Continue?')) {
			return;
		}
		
		try {
			const result = await Projects.initializeFromJson();
			showMessage(`Initialized ${result.projects.length} projects from JSON`, 'success');
		} catch (error) {
			showMessage(error instanceof Error ? error.message : 'Failed to initialize from JSON', 'error');
		}
	}
</script>

<main>
	<div class="header">
		<div>
			<h1>Project Management Dashboard</h1>
			<p>Manage your portfolio projects with realtime database operations.</p>
		</div>
		<div class="header-actions">
			<button class="init-btn" onclick={handleInitFromJson}>
				Initialize from JSON
			</button>
			<button class="create-btn" onclick={showCreateForm}>
				+ Create New Project
			</button>
		</div>
	</div>

	{#if message}
		<div class="message {messageType}">
			{message}
		</div>
	{/if}

	{#if Projects.all.length > 0}
		<div class="filters">
			<div class="search-box">
				<input 
					type="text" 
					placeholder="Search projects..." 
					bind:value={searchTerm}
					class="search-input"
				/>
			</div>
			<div class="filter-dropdown">
				<select bind:value={selectedTagFilter} class="tag-filter">
					<option value="">All Tags</option>
					{#each availableTags as tag}
						<option value={tag}>{tag}</option>
					{/each}
				</select>
			</div>
			<div class="results-count">
				{filteredProjects.length} of {Projects.all.length} projects
			</div>
		</div>
	{/if}

	{#if Projects.loading}
		<div class="loading">Loading projects...</div>
	{:else if Projects.error}
		<div class="error">Error: {Projects.error}</div>
	{:else}
		<div class="projects-grid">
			{#each filteredProjects as project}
				<div class="project-card">
					<div class="project-header">
						<h3>{project.title}</h3>
						<div class="project-actions">
							<button class="edit-btn" onclick={() => showEditForm(project)}>
								Edit
							</button>
							<button class="delete-btn" onclick={() => handleDeleteProject(project.title)}>
								Delete
							</button>
						</div>
					</div>
					
					<div class="project-meta">
						<div class="tags">
							{#each project.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
						<div class="image-info">
							<strong>Image:</strong> {project.image || 'None'}
						</div>
					</div>

					<div class="project-links">
						{#if project.link}
							<a href={project.link} target="_blank" rel="noopener noreferrer">🔗 Live Demo</a>
						{/if}
						{#if project.git}
							<a href={project.git} target="_blank" rel="noopener noreferrer">📂 Repository</a>
						{/if}
						{#if project.yt}
							<a href={project.yt} target="_blank" rel="noopener noreferrer">🎥 Video</a>
						{/if}
					</div>

					<div class="project-desc">
						{#if project.desc.code}
							<div class="desc-section">
								<strong>Code:</strong> {project.desc.code}
							</div>
						{/if}
						{#if project.desc.design}
							<div class="desc-section">
								<strong>Design:</strong> {project.desc.design}
							</div>
						{/if}
					</div>

					<div class="project-tech">
						{#if project.tech.code?.length}
							<div class="tech-section">
								<strong>Code Tech:</strong>
								<div class="tech-list">
									{#each project.tech.code as tech}
										<span class="tech-item">{tech}</span>
									{/each}
								</div>
							</div>
						{/if}
						{#if project.tech.design?.length}
							<div class="tech-section">
								<strong>Design Tech:</strong>
								<div class="tech-list">
									{#each project.tech.design as tech}
										<span class="tech-item">{tech}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					{#if project.awards?.length}
						<div class="project-awards">
							<strong>Awards:</strong>
							{#each project.awards as award}
								<a href={award} target="_blank" rel="noopener noreferrer" class="award-link">
									🏆 Award
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if filteredProjects.length === 0 && Projects.all.length > 0}
			<div class="no-results">
				<h3>No projects found</h3>
				<p>Try adjusting your search or filter criteria.</p>
				<button class="clear-filters" onclick={() => { searchTerm = ''; selectedTagFilter = ''; }}>
					Clear Filters
				</button>
			</div>
		{:else if Projects.all.length === 0}
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

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		color: var(--accent);
		font-family: var(--font-ui);
	}

	.create-btn, .init-btn {
		padding: 1rem 2rem;
		border: 2px solid var(--accent);
		border-radius: 0;
		cursor: pointer;
		font-size: 1rem;
		font-weight: bold;
		font-family: var(--font-ui);
		text-transform: uppercase;
		letter-spacing: 1px;
		white-space: nowrap;
		transition: all 0.1s ease;
		box-shadow: 4px 4px 0 var(--accent-dim);
	}

	.create-btn {
		background: var(--accent);
		color: var(--bg);
	}

	.create-btn:hover {
		background: var(--bg);
		color: var(--accent);
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0 var(--accent-dim);
	}

	.init-btn {
		background: var(--bg);
		color: var(--contrast);
		border-color: var(--outline);
		box-shadow: 4px 4px 0 var(--outline);
	}

	.init-btn:hover {
		background: var(--outline);
		color: var(--bg);
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0 var(--outline);
	}

	.message {
		padding: 1.5rem;
		border: 3px solid;
		margin-bottom: 2rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.3);
	}

	.message.success {
		background: var(--bg);
		color: var(--accent);
		border-color: var(--accent);
	}

	.message.error {
		background: var(--bg);
		color: #ff6b6b;
		border-color: #ff6b6b;
	}

	.filters {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		padding: 2rem;
		background: var(--bg);
		border: 3px solid var(--outline);
		margin-bottom: 2rem;
		flex-wrap: wrap;
		box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.3);
	}

	.search-box {
		flex: 1;
		min-width: 250px;
	}

	.search-input {
		width: 100%;
		padding: 1rem;
		border: 2px solid var(--outline);
		background: var(--bg);
		color: var(--contrast);
		font-size: 1rem;
		font-family: var(--font-ui);
		transition: all 0.1s ease;
		box-shadow: 4px 4px 0 var(--font-dim);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 4px 4px 0 var(--accent-dim);
		transform: translate(-2px, -2px);
	}

	.search-input::placeholder {
		color: var(--font-color);
		text-transform: uppercase;
		letter-spacing: 1px;
		font-size: 0.875rem;
	}

	.filter-dropdown {
		min-width: 200px;
	}

	.tag-filter {
		width: 100%;
		padding: 1rem;
		border: 2px solid var(--outline);
		background: var(--bg);
		color: var(--contrast);
		font-size: 1rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		box-shadow: 4px 4px 0 var(--font-dim);
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.tag-filter:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 4px 4px 0 var(--accent-dim);
		transform: translate(-2px, -2px);
	}

	.results-count {
		font-size: 1rem;
		color: var(--accent);
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		white-space: nowrap;
		border: 2px solid var(--accent);
		padding: 0.75rem 1rem;
		background: var(--bg);
	}

	.clear-filters {
		padding: 1rem 1.5rem;
		background: var(--bg);
		color: var(--accent);
		border: 2px solid var(--accent);
		cursor: pointer;
		font-size: 1rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		box-shadow: 4px 4px 0 var(--accent-dim);
		transition: all 0.1s ease;
	}

	.clear-filters:hover {
		background: var(--accent);
		color: var(--bg);
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0 var(--accent-dim);
	}

	.loading, .error {
		text-align: center;
		padding: 2rem;
		font-size: 1.1rem;
	}

	.no-results {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--text-secondary, #666);
	}

	.no-results h3 {
		margin: 0 0 1rem 0;
		color: var(--text-primary, #333);
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
		gap: 2rem;
	}

	.project-card {
		background: var(--bg);
		border: 3px solid var(--outline);
		padding: 2rem;
		transition: all 0.1s ease;
		box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.3);
		position: relative;
	}

	.project-card:hover {
		transform: translate(-4px, -4px);
		box-shadow: 12px 12px 0 rgba(0, 0, 0, 0.3);
		border-color: var(--accent);
	}

	.project-card::before {
		content: '';
		position: absolute;
		top: -3px;
		left: -3px;
		right: -3px;
		bottom: -3px;
		background: linear-gradient(45deg, var(--accent), var(--accent-dim));
		z-index: -1;
		opacity: 0;
		transition: opacity 0.1s ease;
	}

	.project-card:hover::before {
		opacity: 0.1;
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.project-header h3 {
		margin: 0;
		color: var(--contrast);
		flex: 1;
		font-family: var(--font-ui);
		font-size: 1.5rem;
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	.project-actions {
		display: flex;
		gap: 1rem;
	}

	.edit-btn, .delete-btn {
		padding: 0.75rem 1.5rem;
		border: 2px solid;
		cursor: pointer;
		font-size: 0.875rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		transition: all 0.1s ease;
		box-shadow: 3px 3px 0;
	}

	.edit-btn {
		background: var(--bg);
		color: var(--accent);
		border-color: var(--accent);
		box-shadow: 3px 3px 0 var(--accent-dim);
	}

	.edit-btn:hover {
		background: var(--accent);
		color: var(--bg);
		transform: translate(1px, 1px);
		box-shadow: 2px 2px 0 var(--accent-dim);
	}

	.delete-btn {
		background: var(--bg);
		color: #ff6b6b;
		border-color: #ff6b6b;
		box-shadow: 3px 3px 0 #cc5555;
	}

	.delete-btn:hover {
		background: #ff6b6b;
		color: var(--bg);
		transform: translate(1px, 1px);
		box-shadow: 2px 2px 0 #cc5555;
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

	.image-info {
		font-size: 1rem;
		color: var(--font-color);
		font-family: var(--font-ui);
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-top: 1rem;
	}

	.image-info strong {
		color: var(--contrast);
	}

	.project-links {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.project-links a, .award-link {
		color: var(--accent);
		text-decoration: none;
		font-size: 1rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: 0.5rem 1rem;
		border: 2px solid var(--accent);
		background: var(--bg);
		transition: all 0.1s ease;
		display: inline-block;
		box-shadow: 3px 3px 0 var(--accent-dim);
	}

	.project-links a:hover, .award-link:hover {
		background: var(--accent);
		color: var(--bg);
		transform: translate(1px, 1px);
		box-shadow: 2px 2px 0 var(--accent-dim);
		text-decoration: none;
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

	.desc-section strong, .tech-section strong {
		color: var(--contrast);
		font-family: var(--font-ui);
		text-transform: uppercase;
		letter-spacing: 1px;
		display: block;
		margin-bottom: 0.5rem;
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

	.empty-state, .no-results {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--font-color);
		background: var(--bg);
		border: 3px solid var(--outline);
		box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.3);
	}

	.empty-state h3, .no-results h3 {
		margin: 0 0 1rem 0;
		color: var(--contrast);
		font-family: var(--font-ui);
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 2rem;
	}

	.empty-state p, .no-results p {
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

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			justify-content: stretch;
		}

		.filters {
			flex-direction: column;
			align-items: stretch;
		}

		.search-box, .filter-dropdown {
			min-width: auto;
		}

		.projects-grid {
			grid-template-columns: 1fr;
		}

		.project-header {
			flex-direction: column;
			align-items: stretch;
		}

		.project-actions {
			justify-content: flex-end;
		}

		.modal-overlay {
			padding: 1rem;
		}
	}
</style>