import data from './projects.json';
import type { Project, Facet } from './types';

// Facets class to manage the filter state of the projects.
class facetsClass {
	// State store for the facets
	facets = $state<Facet[]>([
		{ name: 'Design', bool: true },
		{ name: 'Development', bool: true }
	]);
	// toggle method manages the state of the facets, toggling 'bool' value of the 'name' parameter
	toggle(name: string) {
		this.facets = this.facets.map((f) => (f.name === name ? { ...f, bool: !f.bool } : f));
		if (Projects.range.min > Projects.selected.length - 1) {
			Projects.range.reset();
		}
	}
	// selected method returns the selected facets as an array ['name1', 'name2', ...]
	selected() {
		return this.facets.filter((f) => f.bool).map((f) => f.name);
	}
}
// Export the Facets class as a singleton instance.
export const Facets = new facetsClass();

// Projects class to manage the projects state and pagination.
class projectsClass {
	// PRIVATE all, state for the projects, fetched from the JSON file.
	#all = $state<Project[]>(data as Project[]);
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
		return this.#all
			.filter(project => project.tags.some(tag => selectedFacets.includes(tag)))
			.map(project => ({
				...project,
				desc: selectedFacets.map(facet => project.desc[facet.toLowerCase()]).join(' '),
				tech: selectedFacets.flatMap(facet => project.tags.includes(facet) ? project.tech[facet.toLowerCase()] : [])
			}))
	});
}
// Export the Projects class as a singleton instance.
export let Projects = new projectsClass();

