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
		Projects.range.reset();
	}
	// selected method returns the selected facets as an array ['name1', 'name2', ...]
	selected() {
		return this.facets.filter((f) => f.bool).map((f) => f.name);
	}
}
// Export the Facets class as a singleton instance.
export let Facets = new facetsClass();

// Projects class to manage the projects state.
class projectsClass {
	// Projects, state store for the projects, fetched from the JSON file.
	all = $state(data);
	// Mutated, derived state returns the projects with the mutated 'desc' and 'tech' properties.
	mutated = $derived(
		// for each project, for each tag, if tag is present in selected facets; let desc = desc.design or desc.development and tech = tech.design or tech.development
		this.all.map((project) => ({
			...project,
			desc: project.tags.reduce((acc, tag) => {
				if (Facets.selected().includes(tag)) {
					acc = project.desc[tag];
				}
				return acc;
			}, ''),
			tech: project.tags.reduce((acc, tag) => {
				if (Facets.selected().includes(tag)) {
					acc = project.tech[tag];
				}
				return acc;
			}, '')
		}))
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
	// filtered, derived state returns the projects filtered by the selected facets.
	filtered = $derived(
		this.all.filter((project) => project.tags.some((tag) => Facets.selected().includes(tag)))
	);
	// inView, derived state returns the projects in view based on the range.
	inView = $derived(this.filtered.slice(this.range.min, this.range.max));
}
// Export the Projects class as a singleton instance.
export let Projects = new projectsClass();
