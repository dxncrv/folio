// Context7: /sveltejs/svelte - MediaQuery for prefers-reduced-motion
// Reactive accessibility preference detection

import { MediaQuery } from 'svelte/reactivity';

export const prefersReducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
