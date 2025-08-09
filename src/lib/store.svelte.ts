import data from './projects.json';
import type { Project } from './types';

// FacetsClass: facets array is derived from unique tags in data
class FacetsClass {
	// facets: derived array of unique tags from data, each with a boolean for selection.
	facets = $derived.by(() => {
		const uniqueTags = Array.from(
			new Set((data as Project[]).flatMap(project => project.tags))
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