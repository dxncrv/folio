<script lang="ts">
import { Projects } from '$lib/store.svelte';
import type { Project } from '$lib/types';
import Typer from '$lib/_fx/Typer.svelte';
import { slugify } from '$lib/utils';
import { CaseStudies } from '$lib/store.svelte';
import SessionTimer from '$lib/components/start/SessionTimer.svelte';
import LogoutModal from '$lib/components/start/LogoutModal.svelte';
import ProjectGrid from '$lib/components/start/ProjectGrid.svelte';
import MediaManager from '$lib/components/start/MediaManager.svelte';

let message = $state<string>('');
let messageType = $state<'success' | 'error' | 'info' | ''>('');
let showLogoutConfirm = $state(false);
let editingProjectId = $state<string | null>(null);
let editingJson = $state('');
let isCreatingNew = $state(false);
let newProjectJson = $state('');
let caseStudyContents = $state<Record<string, string>>({});

$effect(() => {
	Projects.fetchProjects();
});

$effect(() => {
	const slugs = Projects.all.map(p => slugify(p.title));
	Promise.all(slugs.map(async (slug) => {
		const cs = await CaseStudies.fetchBySlug(slug);
		caseStudyContents[slug] = cs?.content || '';
		caseStudyContents = { ...caseStudyContents };
	}));
});

function showCreateForm() {
	const template = {
		"title": "Tebbie Towners",
		"tags": ["Design"],
		"image": "ph",
		"link": "",
		"git": "",
		"yt": "",
		"awards": [],
		"desc": {
			"code": "",
			"design": "Tebbie Towners is a game that proposes usage of Operant Conditioning to prime empathy in the player. Applied behavioral insights to a concept and the result is a video artefact of onboarding."
		},
		"tech": {
			"code": [],
			"design": []
		},
		"study": {}
	};
	newProjectJson = JSON.stringify(template, null, 2);
	isCreatingNew = true;
	showMessage('Creating new project', 'info');
}

function showEditForm(project: Project) {
	editingProjectId = project.title;
	editingJson = JSON.stringify(project, null, 2);
	showMessage(`Editing "${project.title}"`, 'info');
}

function cancelEditing() {
	editingProjectId = null;
}

function cancelCreating() {
	isCreatingNew = false;
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

async function saveNewProject(json: string) {
	try {
		const project = JSON.parse(json);
		await Projects.addProject(project);
		showMessage('Project created successfully!', 'success');
		isCreatingNew = false;
	} catch (error) {
		showMessage('Invalid JSON: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
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

import { fetchJson, ApiError } from '$lib/apiClient';

async function logout() {
	try {
		await fetchJson('/start/logout', { method: 'POST' });
		// Redirect to login page
		location.href = '/start/login';
	} catch (err) {
		if (err instanceof ApiError) showMessage(err.message || 'Logout failed', 'error');
		else showMessage('Logout failed', 'error');
	}
}

function openLogoutConfirm() {
	showLogoutConfirm = true;
}

function closeLogoutConfirm() {
	showLogoutConfirm = false;
}

async function confirmLogout() {
	await logout();
}
</script>

<main>
	<header>
		<a href="/" class="logo">
			<img src="/favicon.png" alt="Logo" />
		</a>
		<h1>
			Hello, Aash.
		</h1>
		<div class="header-message {messageType}">
			<Typer text={message || "Welcome to the start page."}/>
		</div>
		<SessionTimer />
		<button class="primary" onclick={openLogoutConfirm} aria-label="Logout">
			Logout
		</button>
	</header>

	{#if Projects.loading}
		<div class="loading">Loading projects...</div>
	{:else if Projects.error}
		<div class="error">Error: {Projects.error}</div>
	{:else}
		<ProjectGrid
			projects={Projects.all}
			{editingProjectId}
			{editingJson}
			{isCreatingNew}
			{newProjectJson}
			{caseStudyContents}
			onEdit={showEditForm}
			onSave={saveEditing}
			onCancel={cancelEditing}
			onDelete={handleDeleteProject}
			onCreateForm={showCreateForm}
			onSaveNew={saveNewProject}
			onCancelNew={cancelCreating}
		/>

		{#if Projects.all.length === 0 && !isCreatingNew}
			<div class="empty-state">
				<h3>No projects yet</h3>
				<p>Create your first project to get started!</p>
				<button class="create-btn" onclick={showCreateForm}>
					Create Your First Project
				</button>
			</div>
		{:else if Projects.all.length === 0 && isCreatingNew}
			<div class="projects-grid">
				<!-- New Project Card in Edit Mode -->
				<div class="project-card">
					<div class="project-header">
						<h3>New Project</h3>
						<div class="project-actions editing">
							<button class="save" onclick={() => saveNewProject(newProjectJson)} aria-label="Save new project">
								<iconify-icon icon="line-md:uploading-loop" width="16" height="16"></iconify-icon>
							</button>
							<button class="cancel" onclick={cancelCreating} aria-label="Cancel create">
								<iconify-icon icon="line-md:cancel" width="16" height="16"></iconify-icon>
							</button>
						</div>
					</div>
					<div class="project-json">
						<textarea class="fira-code-normal" style="color: var(--accent);" bind:value={newProjectJson}></textarea>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	<MediaManager />
</main>

	<LogoutModal
		show={showLogoutConfirm}
		onCancel={closeLogoutConfirm}
		onConfirm={confirmLogout}
	/>

<style>
		/* =====================
			 Layout & Main Wrapper
			 ===================== */
		main {
			display: flex;
			flex-direction: column;
			padding: 2rem;
			max-width: 1200px;
			margin: 0 auto;
			gap: 2rem;
		}

		/* =====================
			 Header & Logo
			 ===================== */
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

			.admin-actions { display:flex; gap:0.5rem }
			.logout-btn {
				background: var(--bg);
				color: var(--contrast);
				border: 2px solid var(--outline);
				padding: 0.5rem 0.75rem;
				border-radius: 0.5rem;
				cursor: pointer;
			}
			.logout-btn:hover { border-color: var(--accent); color: var(--accent) }

		/* Logout modal */
		.modal-backdrop {
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 60;
		}
		.logout-modal {
			background: var(--bg);
			border: 1px solid var(--outline);
			border-radius: 0.5rem;
			padding: 2rem;
			max-width: 300px;
			width: 90%;
			text-align: center;
		}
		.modal-actions {
			display: flex;
			gap: 1rem;
			justify-content: center;
		}
		h1 {
			margin: 0 0 0.5rem 0;
			color: var(--accent);
			font-family: var(--font-ui);
		}

		/* =====================
			 Header Message Styles
			 ===================== */
		.header-message {
			flex: 1;
			font-family: var(--font-ui);
			margin: 0.5rem 0;
			font-size: 0.9rem;
			opacity: 0.8;
		}

		/* =====================
			 Loading & Error
			 ===================== */
		.loading, .error {
			text-align: center;
			padding: 2rem;
			font-size: 1.1rem;
		}

		/* =====================
			 Projects Grid & Cards
			 ===================== */
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

		/* =====================
			 Project Actions (Buttons)
			 ===================== */
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
			color: #ff9800;
			padding: 0.5rem 1rem;
			border: 2px solid var(--outline);
		}
		.cancel:hover {
			color: #ff9800;
			border: 2px solid #ff9800;
			background: var(--bg);
		}

		/* =====================
			 Project JSON Display
			 ===================== */
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

		/* =====================
			 Create Project Card
			 ===================== */
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

/* Empty State */
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
</style>