import type { Project, CaseStudy } from './types';

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

	// API methods for CRUD operations
	async fetchProjects() {
		this.loading = true;
		this.error = null;
		try {
			const response = await fetch('/api/projects');
			if (!response.ok) {
				throw new Error('Failed to fetch projects');
			}
			this.all = await response.json();
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
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(project)
			});
			if (!response.ok) {
				throw new Error('Failed to add project');
			}
			this.all = await response.json();
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
			const response = await fetch(`/api/projects/${encodeURIComponent(originalTitle)}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedProject)
			});
			if (!response.ok) {
				throw new Error('Failed to update project');
			}
			this.all = await response.json();
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
			const response = await fetch(`/api/projects/${encodeURIComponent(title)}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				throw new Error('Failed to delete project');
			}
			this.all = await response.json();
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
			const response = await fetch('/api/projects/init', {
				method: 'POST'
			});
			if (!response.ok) {
				throw new Error('Failed to initialize from JSON');
			}
			const result = await response.json();
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
			const res = await fetch('/api/case-studies');
			if (!res.ok) throw new Error('Failed to fetch case studies');
			const list: CaseStudy[] = await res.json();
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
				const res = await fetch(`/api/case-studies/${encodeURIComponent(slug)}`);
				if (!res.ok) return null;
				const cs: CaseStudy = await res.json();
				this.#cache.set(slug, cs);
				// merge into `all` if missing
				if (!this.all.find(x => x.slug === cs.slug)) this.all = [...this.all, cs];
				return cs;
			} catch (err) {
				this.errorBySlug = { ...this.errorBySlug, [slug]: err instanceof Error ? err.message : 'Unknown error' };
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
			const res = await fetch('/api/case-studies', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(caseStudy)
			});
			if (!res.ok) throw new Error('Failed to add case study');
			this.all = await res.json();
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
			const res = await fetch(`/api/case-studies/${encodeURIComponent(slug)}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updated)
			});
			if (!res.ok) throw new Error('Failed to update case study');
			this.all = await res.json();
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
			const res = await fetch(`/api/case-studies/${encodeURIComponent(slug)}`, {
				method: 'DELETE'
			});
			if (!res.ok) throw new Error('Failed to delete case study');
			this.all = await res.json();
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