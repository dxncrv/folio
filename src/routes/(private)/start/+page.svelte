<script lang="ts">
import { Projects } from '$lib/store.svelte';
import type { Project } from '$lib/types';
import Typer from '$lib/_fx/Typer.svelte';
import { deriveSlug } from '$lib';
import SessionTimer from '$lib/components/start/session-timer.svelte';
import Logout from '$lib/components/start/logout.svelte';
import ProjectGrid from '$lib/components/start/project-grid.svelte';

let { data } = $props();

let message = $state<string>('');
let messageType = $state<'success' | 'error' | 'info' | ''>('');
let showLogoutConfirm = $state(false);

$effect(() => {
	Projects.fetchProjects();
});

// Case study contents are now part of the project data
let caseStudyContents = $derived(
	Projects.all.reduce((acc, p) => {
		acc[deriveSlug(p)] = p.study || '';
		return acc;
	}, {} as Record<string, string>)
);

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

<svelte:head>
	<title>Admin - Start</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

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
		<div class="header-actions">
			<a href={data.pbDashboardUrl} target="_blank" rel="noopener noreferrer" class="btn secondary" aria-label="PocketBase Dashboard">
				<iconify-icon icon="simple-icons:pocketbase" width="18" height="18"></iconify-icon>
				PB Dashboard
			</a>
			<button class="btn primary" onclick={openLogoutConfirm} aria-label="Logout">
				Logout
			</button>
		</div>
	</header>



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

		/* Header Actions */
		.header-actions {
			display: flex;
			gap: 0.75rem;
			align-items: center;
		}
		.btn {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			background: var(--bg);
			color: var(--contrast);
			border: 2px solid var(--outline);
			padding: 0.5rem 1rem;
			border-radius: 0.5rem;
			cursor: pointer;
			font-family: var(--font-ui);
			font-size: 0.9rem;
			text-decoration: none;
			transition: all 0.2s ease;
		}
		.btn:hover {
			border-color: var(--accent);
			color: var(--accent);
		}
		.btn.secondary {
			opacity: 0.9;
		}
		.btn.primary:hover {
			background: var(--accent);
			color: var(--bg);
		}

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