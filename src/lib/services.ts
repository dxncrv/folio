// Pure API service functions - no state management
// This layer provides reusable API calls that can be used by stores, server code, or components
// TODO: Implement optimal caching strategy without overengineering:
// - Cache frequently accessed data (projects, case studies) in Redis with TTL
// - Use Vercel Edge Network for static data caching
// - Consider client-side caching for user-specific data
// - Avoid complex cache invalidation logic; prefer time-based expiration
import { fetchJson } from './apiClient';
import type { Project, CaseStudy, Media } from './types';

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

/**
 * CaseStudyService - Handles all case study-related API calls
 */
export const CaseStudyService = {
	/**
	 * Fetch all case studies from the API
	 */
	async fetchAll(): Promise<CaseStudy[]> {
		return await fetchJson('/api/case-studies');
	},

	/**
	 * Fetch a single case study by slug
	 * Returns null if not found (404)
	 */
	async fetchBySlug(slug: string): Promise<CaseStudy | null> {
		try {
			return await fetchJson(`/api/case-studies/${encodeURIComponent(slug)}`);
		} catch (err: any) {
			if (err.status === 404) return null;
			throw err;
		}
	},

	/**
	 * Create a new case study (requires admin auth)
	 */
	async create(caseStudy: CaseStudy): Promise<CaseStudy[]> {
		return await fetchJson('/api/case-studies', {
			method: 'POST',
			requiresAuth: true,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(caseStudy)
		});
	},

	/**
	 * Update an existing case study by slug (requires admin auth)
	 */
	async update(slug: string, caseStudy: CaseStudy): Promise<CaseStudy[]> {
		return await fetchJson(`/api/case-studies/${encodeURIComponent(slug)}`, {
			method: 'PUT',
			requiresAuth: true,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(caseStudy)
		});
	},

	/**
	 * Delete a case study by slug (requires admin auth)
	 */
	async delete(slug: string): Promise<CaseStudy[]> {
		return await fetchJson(`/api/case-studies/${encodeURIComponent(slug)}`, {
			method: 'DELETE',
			requiresAuth: true
		});
	}
};

/**
 * MediaService - Handles all media-related API calls
 */
export const MediaService = {
	/**
	 * Fetch all media items from the API
	 */
	async fetchAll(): Promise<Media[]> {
		return await fetchJson('/api/media');
	},

	/**
	 * Update/replace all media items (requires admin auth)
	 */
	async updateAll(media: Media[]): Promise<Media[]> {
		return await fetchJson('/api/media', {
			method: 'POST',
			requiresAuth: true,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(media)
		});
	},

	/**
	 * Update a single media item (requires admin auth)
	 */
	async updateItem(item: Media): Promise<Media[]> {
		return await fetchJson('/api/media', {
			method: 'PUT',
			requiresAuth: true,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(item)
		});
	},

	/**
	 * Delete a media item by ID (requires admin auth)
	 */
	async deleteItem(id: string): Promise<Media[]> {
		return await fetchJson('/api/media', {
			method: 'DELETE',
			requiresAuth: true,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		});
	},

	/**
	 * Trigger a media scan (requires admin auth)
	 * Scans static/videos and static/assets directories
	 */
	async scan(): Promise<any> {
		return await fetchJson('/api/media/scan', {
			method: 'POST',
			requiresAuth: true
		});
	}
};
