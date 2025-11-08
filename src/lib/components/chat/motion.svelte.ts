// Context7: Motion preference detection with derived computed values
// Provides reactive transition parameters based on accessibility settings

import { MediaQuery } from 'svelte/reactivity';
import { quintOut } from 'svelte/easing';

function createMotionPreferences() {
	const mediaQuery = new MediaQuery('(prefers-reduced-motion: reduce)');

	// Context7: Derived values for transition configuration
	const prefersReducedMotion = $derived(mediaQuery.current);

	const transitionDuration = $derived(prefersReducedMotion ? 0 : 300);

	const transitionParams = $derived(
		prefersReducedMotion
			? { duration: 0 }
			: { y: 20, duration: 300, easing: quintOut }
	);

	// Return getters to preserve reactivity and avoid state_referenced_locally warnings
	return {
		get mediaQuery() { return mediaQuery; },
		get prefersReducedMotion() { return prefersReducedMotion; },
		get transitionDuration() { return transitionDuration; },
		get transitionParams() { return transitionParams; }
	} as const;
}

// Export singleton with derived state
export const motionPrefs = createMotionPreferences();

// Legacy export for backwards compatibility
export const prefersReducedMotion = motionPrefs.mediaQuery;
