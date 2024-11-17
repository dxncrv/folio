import data from './projects.json';

// Facets class to manage the filter state of the projects.
class facetsClass {
	// State store for the facets
	facets = $state([
		{ name: 'Design', bool: true },
		{ name: 'Development', bool: true }
	]);
	// toggle method manages the state of the facets, toggling 'bool' value of the 'name' parameter
	toggle(name: string) {
		this.facets = this.facets.map((f) => (f.name === name ? { ...f, bool: !f.bool } : f));
		if (Projects.range.min > Projects.mutated.length - 1) {
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

// Projects class to manage the projects state.
class projectsClass {
	// Projects, state store for the projects, fetched from the JSON file.
	all = $state(data);
	// filtered, derived state returns the projects filtered by the selected facets.
	filtered = $derived(
		this.all.filter((project) => project.tags.some((tag) => Facets.selected().includes(tag)))
	);
	// derived state returns the projects with the description and technologies based on the selected facets.
	mutated = $derived(
		this.filtered.map((project) => {
			let desc = '';
			let tech: any[] = [];
			if (Facets.selected().includes('Design') && project.desc.design) {
				desc += project.desc.design;
				tech = tech.concat(project.tech.design);
			}
			if (Facets.selected().includes('Development') && project.desc.development) {
				if (desc) desc += ' ';
				desc += project.desc.development;
				tech = tech.concat(project.tech.development);
			}
			return { ...project, desc, tech };
		})
	);
	// Range, state store for pagination.
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
	// inView, derived state returns the projects in view based on the range.
	inView = $derived(this.mutated.slice(this.range.min, this.range.max));
}
// Export the Projects class as a singleton instance.
export let Projects = new projectsClass();

