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

import type { Project, CaseStudy, Media } from './types';
import { ProjectService, CaseStudyService, MediaService } from './services';

// FacetsClass: facets array is derived from unique tags in data
class FacetsClass {
	// facets: derived array of unique tags from data, each with a boolean for selection.
	facets = $derived.by(() => {
		const uniqueTags = Array.from(
			new Set(Projects.all.flatMap(project => project.tags))
		).sort();
		return uniqueTags.map(tag => ({ name: tag, bool: true }));
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
	all = $state<Project[]>([]);
	// PUBLIC loading state
	loading = $state<boolean>(false);
	// PUBLIC error state
	error = $state<string | null>(null);
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

	// PUBLIC selected, derived state returns the projects based on the selected facets.
	selected = $derived.by(() => {
		// Get the selected facets
		const selectedFacets = Facets.selected();
		// Filter the projects based on the selected facets and return the projects with the 'desc' and 'tech' properties updated.
		return this.all
			.filter((project: Project) => project.tags.some((tag: string) => selectedFacets.includes(tag)))
			.map((project: Project) => ({
				...project,
				desc: selectedFacets
					.map(facet => project.desc[facet.toLowerCase()])
					.filter(Boolean)
					.join(' '),
				tech: selectedFacets
					.flatMap(facet => 
						project.tags.includes(facet) 
							? (project.tech[facet.toLowerCase()] || [])
							: []
					)
			}));
	});

	// API methods delegate to service layer
	async fetchProjects() {
		this.loading = true;
		this.error = null;
		try {
			this.all = await ProjectService.fetchAll();
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			this.loading = false;
		}
	}

	async addProject(project: Project) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await ProjectService.create(project);
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			this.loading = false;
		}
	}

	async updateProject(originalTitle: string, updatedProject: Project) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await ProjectService.update(originalTitle, updatedProject);
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			this.loading = false;
		}
	}

	async deleteProject(title: string) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await ProjectService.delete(title);
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			this.loading = false;
		}
	}

	async initializeFromJson() {
		this.loading = true;
		this.error = null;
		try {
			const result = await ProjectService.initializeFromJson();
			this.all = result.projects;
			return result;
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		} finally {
			this.loading = false;
		}
	}
}

// Export the Projects class as a singleton instance.
export let Projects = new projectsClass();

// CaseStudies class to manage the case studies state and API interactions.
class caseStudiesClass {
	all = $state<CaseStudy[]>([]);
	loading = $state<boolean>(false);
	error = $state<string | null>(null);

	// Per-slug cache and inflight dedupe
	#cache = new Map<string, CaseStudy>();
	#inflight = new Map<string, Promise<CaseStudy | null>>();

	// Per-slug loading/error metadata
	loadingBySlug = $state<Record<string, boolean>>({});
	errorBySlug = $state<Record<string, string | null>>({});

	async fetchAll() {
		this.loading = true;
		this.error = null;
		try {
			const list = await CaseStudyService.fetchAll();
			this.all = list;
			// populate cache
			for (const cs of list) this.#cache.set(cs.slug, cs);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			this.loading = false;
		}
	}

	async fetchBySlug(slug: string) {
		if (!slug) return null;
		// return cached value when available
		if (this.#cache.has(slug)) return this.#cache.get(slug)!;
		// return inflight promise when available (dedupe)
		if (this.#inflight.has(slug)) return this.#inflight.get(slug)!;

		this.loadingBySlug = { ...this.loadingBySlug, [slug]: true };
		this.errorBySlug = { ...this.errorBySlug, [slug]: null };

		const p = (async () => {
			try {
				const cs = await CaseStudyService.fetchBySlug(slug);
				if (!cs) return null;
				this.#cache.set(slug, cs);
				// merge into `all` if missing
				if (!this.all.find((x) => x.slug === cs.slug)) this.all = [...this.all, cs];
				return cs;
			} catch (err) {
				this.errorBySlug = {
					...this.errorBySlug,
					[slug]: err instanceof Error ? err.message : 'Unknown error'
				};
				return null;
			} finally {
				this.loadingBySlug = { ...this.loadingBySlug, [slug]: false };
				this.#inflight.delete(slug);
			}
		})();

		this.#inflight.set(slug, p);
		return p;
	}

	async addCaseStudy(caseStudy: CaseStudy) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await CaseStudyService.create(caseStudy);
			// refresh cache entries
			for (const cs of this.all) this.#cache.set(cs.slug, cs);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			throw err;
		} finally {
			this.loading = false;
		}
	}

	async updateCaseStudy(slug: string, updated: CaseStudy) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await CaseStudyService.update(slug, updated);
			// refresh cache entries and remove old slug if changed
			for (const cs of this.all) this.#cache.set(cs.slug, cs);
			if (slug !== updated.slug) this.#cache.delete(slug);
			return this.all;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			throw err;
		} finally {
			this.loading = false;
		}
	}

	async deleteCaseStudy(slug: string) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await CaseStudyService.delete(slug);
			// update cache
			this.#cache.delete(slug);
			for (const cs of this.all) this.#cache.set(cs.slug, cs);
			return this.all;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			throw err;
		} finally {
			this.loading = false;
		}
	}
}

export const CaseStudies = new caseStudiesClass();

// Media class to manage media files
class mediaClass {
	all = $state<Media[]>([]);
	loading = $state<boolean>(false);
	error = $state<string | null>(null);

	async fetchMedia() {
		this.loading = true;
		this.error = null;
		try {
			this.all = await MediaService.fetchAll();
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			this.loading = false;
		}
	}

	async updateMedia(media: Media[]) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await MediaService.updateAll(media);
			return this.all;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			throw err;
		} finally {
			this.loading = false;
		}
	}

	async updateMediaItem(item: Media) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await MediaService.updateItem(item);
			return this.all;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			throw err;
		} finally {
			this.loading = false;
		}
	}

	async deleteMediaItem(id: string) {
		this.loading = true;
		this.error = null;
		try {
			this.all = await MediaService.deleteItem(id);
			return this.all;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			throw err;
		} finally {
			this.loading = false;
		}
	}

	async scanMedia() {
		this.loading = true;
		this.error = null;
		try {
			const result = await MediaService.scan();
			await this.fetchMedia(); // Refresh after scan
			return result;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unknown error';
			throw err;
		} finally {
			this.loading = false;
		}
	}
}

export const MediaStore = new mediaClass();