/**
 * Client-side reactive stores for managing application state
 * 
 * This module handles ONLY reactive state and UI logic.
 * All API calls are delegated to the service layer (services.ts).
 * 
 * Architecture:
 * - Stores manage $state and $derived reactive variables
 * - Services handle all fetch/CRUD operations
 * - Components consume stores for reactivity
 */

import type { Project } from './types';
import { ProjectService } from './services';

// FacetsClass: facets array is derived from unique tags in data [DEPRECIATED]
class FacetsClass {
	#lastTags: string[] = [];
	#cachedFacets: { name: string; bool: boolean }[] = [];

	// facets: derived array of unique tags from data, each with a boolean for selection.
	facets = $derived.by(() => {
		const allTags = Projects.all.flatMap(project => project.tags);
		const uniqueTags = Array.from(new Set(allTags)).sort();
		
		// Skip recomputation if tags haven't changed
		if (uniqueTags.length === this.#lastTags.length && 
		    uniqueTags.every((tag, i) => tag === this.#lastTags[i])) {
			return this.#cachedFacets;
		}
		
		this.#lastTags = uniqueTags;
		this.#cachedFacets = uniqueTags.map(tag => ({ name: tag, bool: true }));
		return this.#cachedFacets;
	});

	// toggle: toggles the boolean value for a given facet name.
	toggle(name: string) {
		this.facets = this.facets.map(f =>
			f.name === name ? { ...f, bool: !f.bool } : f
		);
		// Reset pagination if current min index exceeds selected projects.
		if (Projects.range.min > Projects.selected.length - 1) {
			Projects.range.reset();
		}
	}

	// selected: returns the names of facets that are currently selected.
	selected() {
		return this.facets.filter(f => f.bool).map(f => f.name);
	}
}
export const Facets = new FacetsClass();

// Projects class to manage the projects state and pagination.
class projectsClass {
	// PUBLIC all, state for the projects, fetched from the API.
	all = $state.raw<Project[]>([]);
	// PUBLIC loading state
	loading = $state<boolean>(false);
	// PUBLIC error state
	error = $state<string | null>(null);
	// Flag to prevent redundant initializations
	#initialized = $state<boolean>(false);
	// PUBLIC range, state for pagination.
	range = $state({
		min: 0,
		max: 3,
		prev: () => {
			this.range.min -= 3;
			this.range.max -= 3;
		},
		next: () => {
			this.range.min += 3;
			this.range.max += 3;
		},
		reset: () => {
			this.range.min = 0;
			this.range.max = 3;
		}
	});

	// Helper to wrap async operations with loading/error handling
	private async withLoading<T>(fn: () => Promise<T>): Promise<T> {
		this.loading = true;
		this.error = null;
		try {
			return await fn();
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			this.loading = false;
		}
	}

	// PUBLIC selected, derived state returns the projects based on the selected facets.
	// Optimized: Single-pass reduce instead of filter->map chain
	selected = $derived.by(() => {
		const selectedFacets = Facets.selected();
		const selectedSet = new Set(selectedFacets); // O(1) lookup vs includes O(n)
		
		return this.all.reduce<Project[]>((acc, project) => {
			// Skip if no matching tags
			if (!project.tags.some((tag: string) => selectedSet.has(tag))) return acc;
			
			// Build desc and tech in single iteration
			let desc = '';
			const techArr: string[] = [];
			
			for (const facet of selectedFacets) {
				const facetLower = facet.toLowerCase();
				const descVal = project.desc[facetLower];
				if (descVal) desc += (desc ? ' ' : '') + descVal;
				
				if (project.tags.includes(facet)) {
					const techVal = project.tech[facetLower];
					if (techVal) techArr.push(...techVal);
				}
			}
			
			acc.push({ ...project, desc: desc as any, tech: techArr as any });
			return acc;
		}, []);
	});

	// Initialize store with server-loaded data (for SSR)
	initialize(projects: Project[]) {
		if (projects.length > 0) {
			this.all = projects;
			this.#initialized = true;
		}
	}

	// API methods delegate to service layer
	async fetchProjects() {
		return this.withLoading(async () => {
			this.all = await ProjectService.fetchAll();
		});
	}

	async addProject(project: Project) {
		return this.withLoading(async () => {
			this.all = await ProjectService.create(project);
		});
	}

	async updateProject(originalTitle: string, updatedProject: Project) {
		return this.withLoading(async () => {
			this.all = await ProjectService.update(originalTitle, updatedProject);
		});
	}

	async deleteProject(title: string) {
		return this.withLoading(async () => {
			this.all = await ProjectService.delete(title);
		});
	}
}

// Export the Projects class as a singleton instance.
export let Projects = new projectsClass();