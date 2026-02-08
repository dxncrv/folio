/**
 * Pure API service functions - no state management
 * This layer provides reusable API calls that can be used by stores, server code, or components
 */
import { fetchJson } from './apiClient';
import type { Project } from './types';

/**
 * ProjectService - Handles all project-related API calls
 */
export const ProjectService = {
	/**
	 * Fetch all projects from the API
	 */
	async fetchAll(): Promise<Project[]> {
		return await fetchJson('/api/projects');
	},

	/**
	 * Create a new project (requires admin session cookie)
	 */
	async create(project: Project): Promise<Project[]> {
		return await fetchJson('/api/projects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(project)
		});
	},

	/**
	 * Update an existing project by title (requires admin session cookie)
	 */
	async update(originalTitle: string, updatedProject: Project): Promise<Project[]> {
		return await fetchJson(`/api/projects/${encodeURIComponent(originalTitle)}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedProject)
		});
	},

	/**
	 * Delete a project by title (requires admin session cookie)
	 */
	async delete(title: string): Promise<Project[]> {
		return await fetchJson(`/api/projects/${encodeURIComponent(title)}`, {
			method: 'DELETE'
		});
	}
};
