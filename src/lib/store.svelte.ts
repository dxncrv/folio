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
	}
	// selected method returns the selected facets as an array ['name1', 'name2', ...]
	selected() {
		return this.facets.filter((f) => f.bool).map((f) => f.name);
	}
}
// Export the Facets class as a singleton instance.
export let Facets = new facetsClass();
