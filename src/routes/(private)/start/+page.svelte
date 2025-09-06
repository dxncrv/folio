<script lang="ts">
import { Projects } from '$lib/store.svelte';
import type { Project } from '$lib/types';
import Typer from '$lib/_fx/Typer.svelte';
import { onMount, onDestroy } from 'svelte';
import { slugify } from '$lib/utils';
import { CaseStudies } from '$lib/store.svelte';
import Editor from '$lib/components/editor.svelte';

let message = $state<string>('');
let messageType = $state<'success' | 'error' | 'info' | ''>('');
let sessionExpiresAt: number | null = null;
let remaining = $state('00:00');
let isExpired = $state(false);

function readExpiryFromStorage() {
	try {
		// Prefer localStorage value written at login
		const v = localStorage.getItem('admin_token_expires');
		if (v) return Number(v);
	} catch (e) {
		// ignore
	}
	// fallback: try cookie
	const match = document.cookie.match(/(?:^|; )admin_token_expires=(\d+)/);
	if (match) return Number(match[1]);
	return null;
}

function formatRemaining(ms: number) {
	if (ms <= 0) return '00:00';
	const totalSec = Math.ceil(ms / 1000);
	const mins = Math.floor(totalSec / 60);
	const secs = totalSec % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// update remaining every 500ms for responsiveness
let timerHandle: number | null = null;
function startTimer() {
	stopTimer();
	sessionExpiresAt = readExpiryFromStorage();
	timerHandle = setInterval(() => {
			if (!sessionExpiresAt) {
				isExpired = false;
				remaining = '00:00';
				return;
			}
			const r = sessionExpiresAt - Date.now();
			if (r <= 0) {
				// expired: clear storage and stop
				isExpired = true;
				remaining = 'Expired';
				try { localStorage.removeItem('admin_token_expires'); } catch (e) {}
				document.cookie = 'admin_token_expires=; path=/; max-age=0';
				stopTimer();
			} else {
				isExpired = false;
				remaining = formatRemaining(r);
			}
	}, 500) as unknown as number;
}

function stopTimer() {
	if (timerHandle) {
		clearInterval(timerHandle as unknown as number);
		timerHandle = null;
	}
}

// Start when component mounts
onMount(() => startTimer());
onDestroy(() => stopTimer());
let showLogoutConfirm = $state(false);
let editingProjectId = $state<string | null>(null);
let editingJson = $state('');
let isCreatingNew = $state(false);
let newProjectJson = $state('');
let caseStudyContents = $state<Record<string, string>>({});

$effect(() => {
	(async () => {
		await Projects.fetchProjects();
		const slugs = Projects.all.map(p => slugify(p.title));
		await Promise.all(slugs.map(async (slug) => {
			const cs = await CaseStudies.fetchBySlug(slug);
			caseStudyContents[slug] = cs?.content || '';
			caseStudyContents = { ...caseStudyContents };
		}));
	})();
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

async function logout() {
	try {
		await fetch('/start/logout', { method: 'POST' });
		// Redirect to login page
		location.href = '/start/login';
	} catch (err) {
		showMessage('Logout failed', 'error');
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
		<span class="session-timer" aria-live="polite" class:expired={isExpired}>{remaining}</span>
		<button class="primary" onclick={openLogoutConfirm} aria-label="Logout">
			Logout
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
						<div class="project-status">
							<span class="status-circle" class:live={caseStudyContents[slugify(project.title)]} class:local={!caseStudyContents[slugify(project.title)]}></span>
						</div>
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
					<Editor
						initialContent={caseStudyContents[slugify(project.title)] || ''}
						slug={slugify(project.title)}
					/>
				</div>
			{/each}
			<!-- New Project Card in Edit Mode -->
			{#if isCreatingNew}
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
			{:else}
				<!-- Create New Project Button -->
				<button class="create-project-card" onclick={showCreateForm}>
					<iconify-icon icon="line-md:plus" width="24" height="24"></iconify-icon>
					<span>Create New Project</span>
				</button>
			{/if}
		</div>

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
</main>

	{#if showLogoutConfirm}
		<div class="modal-backdrop">
			<div class="logout-modal">
				<div class="modal-header">
					<iconify-icon icon="line-md:logout" width="48" height="48"></iconify-icon>
					<h3>Confirm Logout</h3>
					<p>Are you sure you want to sign out? You will need to log in again to access admin features.</p>
				</div>
				<div class="modal-actions">
					<button class="btn-cancel" onclick={closeLogoutConfirm}>
						<iconify-icon icon="line-md:cancel" width="20" height="20"></iconify-icon>
						Cancel
					</button>
					<button class="btn-logout" onclick={confirmLogout}>
						<iconify-icon icon="line-md:logout" width="20" height="20"></iconify-icon>
						Sign Out
					</button>
				</div>
			</div>
		</div>
	{/if}

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
			background: rgba(0, 0, 0, 0.6);
			backdrop-filter: blur(4px);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 60;
			animation: fadeIn 0.3s ease;
		}
		.logout-modal {
			background: var(--bg);
			border: 1px solid var(--outline);
			border-radius: 1rem;
			padding: 2.5rem;
			max-width: 420px;
			width: 90%;
			box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
			animation: slideIn 0.3s ease;
			text-align: center;
		}
		.logout-modal:hover {
			border-color: var(--accent);
		}
		.modal-header {
			margin-bottom: 2rem;
		}
		.modal-header iconify-icon {
			color: #ff6b6b;
			margin-bottom: 1rem;
			display: block;
		}
		.modal-header h3 {
			color: var(--contrast);
			font-size: 1.75rem;
			font-weight: 600;
			margin: 0 0 0.75rem 0;
			font-family: var(--font-ui);
		}
		.modal-header p {
			color: var(--font-color);
			font-size: 0.95rem;
			margin: 0;
			font-family: var(--font-read);
			line-height: 1.5;
		}
		.modal-actions {
			display: flex;
			gap: 1rem;
			justify-content: center;
		}
		.btn-cancel {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			background: none;
			border: 2px solid var(--outline);
			padding: 0.875rem 1.5rem;
			border-radius: 0.75rem;
			cursor: pointer;
			font-family: var(--font-ui);
			font-size: 1rem;
			font-weight: 500;
			color: var(--contrast);
			transition: all 0.3s ease;
		}
		.btn-cancel:hover {
			border-color: var(--accent);
			color: var(--accent);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		}
		.btn-logout {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			background: none;
			border: 2px solid #ff6b6b;
			padding: 0.875rem 1.5rem;
			border-radius: 0.75rem;
			cursor: pointer;
			font-family: var(--font-ui);
			font-size: 1rem;
			font-weight: 500;
			color: #ff6b6b;
			transition: all 0.3s ease;
		}
		.btn-logout:hover {
			background: #ff6b6b;
			color: white;
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
		}
		.btn-logout:active,
		.btn-cancel:active {
			transform: translateY(0);
		}

		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
		@keyframes slideIn {
			from {
				opacity: 0;
				transform: translateY(-20px) scale(0.95);
			}
			to {
				opacity: 1;
				transform: translateY(0) scale(1);
			}
		}

		@media (max-width: 480px) {
			.logout-modal {
				padding: 2rem 1.5rem;
				margin: 1rem;
			}
			.modal-header h3 {
				font-size: 1.5rem;
			}
			.modal-actions {
				flex-direction: column;
			}
			.btn-cancel,
			.btn-logout {
				width: 100%;
				justify-content: center;
			}
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
		.create-project-card iconify-icon {
			opacity: 0.7;
			transition: opacity 0.3s ease;
		}
		.create-project-card:hover iconify-icon {
			opacity: 1;
		}

		/* =====================
			 Project Meta, Status, Tags, Links
			 ===================== */
		.project-meta {
			margin-bottom: 1rem;
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

		/* =====================
			 Project Description, Tech, Awards
			 ===================== */
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

		/* Session timer next to header */
		.session-timer {
			font-family: var(--font-ui);
			margin-left: 0.75rem;
			font-size: 0.9rem;
			color: var(--font-color);
			background: rgba(255,255,255,0.03);
			padding: 0.15rem 0.5rem;
			border-radius: 0.35rem;
			border: 1px solid rgba(255,255,255,0.03);
		}

		.session-timer.expired {
			color: #ff6b6b;
			border-color: rgba(255,107,107,0.12);
			background: rgba(255,107,107,0.03);
			font-weight: 600;
		}
</style>