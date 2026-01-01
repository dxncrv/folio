// Pure API service functions - no state management
// This layer provides reusable API calls that can be used by stores, server code, or components
// TODO: Implement optimal caching strategy without overengineering:
// - Cache frequently accessed data (projects, case studies) in Redis with TTL
// - Use Vercel Edge Network for static data caching
// - Consider client-side caching for user-specific data
// - Avoid complex cache invalidation logic; prefer time-based expiration
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
	 * Create a new project (requires admin auth)
	 */
	async create(project: Project): Promise<Project[]> {
		return await fetchJson('/api/projects', {
			method: 'POST',
			requiresAuth: true,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(project)
		});
	},

	/**
	 * Update an existing project by title (requires admin auth)
	 */
	async update(originalTitle: string, updatedProject: Project): Promise<Project[]> {
		return await fetchJson(`/api/projects/${encodeURIComponent(originalTitle)}`, {
			method: 'PUT',
			requiresAuth: true,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedProject)
		});
	},

	/**
	 * Delete a project by title (requires admin auth)
	 */
	async delete(title: string): Promise<Project[]> {
		return await fetchJson(`/api/projects/${encodeURIComponent(title)}`, {
			method: 'DELETE',
			requiresAuth: true
		});
	},

	/**
	 * Initialize projects from JSON file (requires admin auth)
	 */
	async initializeFromJson(): Promise<{ projects: Project[]; message: string }> {
		return await fetchJson('/api/projects/init', {
			method: 'POST',
			requiresAuth: true
		});
	}
};
