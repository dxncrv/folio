<script lang="ts">
import { Projects } from '$lib/store.svelte';
import type { Project } from '$lib/types';
import Typer from '$lib/_fx/Typer.svelte';
import { slugify } from '$lib/formatting';
import { CaseStudies } from '$lib/store.svelte';
import SessionTimer from '$lib/components/start/SessionTimer.svelte';
import Logout from '$lib/components/start/logout.svelte';
import ProjectGrid from '$lib/components/start/ProjectGrid.svelte';
import MediaManager from '$lib/components/start/MediaManager.svelte';
import RedisInspector from '$lib/components/start/RedisInspector.svelte';

let message = $state<string>('');
let messageType = $state<'success' | 'error' | 'info' | ''>('');
let showLogoutConfirm = $state(false);
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

function handleCreateNew() {
	showMessage('Creating new project', 'info');
}

async function handleSaveProject(originalTitle: string, updatedProject: Project) {
	try {
		await Projects.updateProject(originalTitle, updatedProject);
		showMessage('Project updated successfully!', 'success');
	} catch (error) {
		showMessage('Failed to update: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
		throw error; // Re-throw so the card can handle it
	}
}

async function handleSaveNewProject(project: Project) {
	try {
		await Projects.addProject(project);
		showMessage('Project created successfully!', 'success');
	} catch (error) {
		showMessage('Failed to create: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
		throw error; // Re-throw so the grid can handle it
	}
}

async function handleDeleteProject(title: string) {
	try {
		await Projects.deleteProject(title);
		showMessage('Project deleted successfully!', 'success');
	} catch (error) {
		showMessage('Failed to delete: ' + (error instanceof Error ? error.message : 'An error occurred'), 'error');
		throw error; // Re-throw so the card can handle it
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

	<RedisInspector />

	{#if Projects.loading}
		<div class="loading">Loading projects...</div>
	{:else if Projects.error}
		<div class="error">Error: {Projects.error}</div>
	{:else}
		<ProjectGrid
			projects={Projects.all}
			{caseStudyContents}
			onSave={handleSaveProject}
			onDelete={handleDeleteProject}
			onCreateNew={handleCreateNew}
			onSaveNew={handleSaveNewProject}
		/>
	{/if}

	<MediaManager />
</main>

	<Logout
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
</style>