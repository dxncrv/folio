/**
 * Theme Context & State Management
 * 
 * Manages document theme state and provides reactive theme detection
 * across the application. Uses Svelte 5 runes API with context pattern.
 * 
 * Architecture:
 * - Theme state persists across component tree via context
 * - Derived values compute blend mode based on current theme
 * - Single source of truth: document.documentElement data-theme attribute
 */

import { createContext } from 'svelte';

export type Theme = 'light' | 'dark';
export type BlendMode = 'color-dodge' | 'color-burn';

class ThemeStore {
	// Current active theme, tracked from document
	theme = $state<Theme>('dark');

	// Derived blend mode based on theme (computed once and cached)
	blendMode = $derived<BlendMode>(this.theme === 'light' ? 'color-dodge' : 'color-burn');

	constructor() {
		// Initialize from document on browser
		if (typeof document !== 'undefined') {
			const initialTheme = (document.documentElement.getAttribute('data-theme') || 'dark') as Theme;
			this.theme = initialTheme;

			// Listen for theme changes via MutationObserver
			const observer = new MutationObserver(() => {
				const newTheme = (document.documentElement.getAttribute('data-theme') || 'dark') as Theme;
				if (newTheme !== this.theme) {
					this.theme = newTheme;
				}
			});

			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		}
	}
}

// Create the context for theme
export const [getThemeStore, setThemeStore] = createContext<ThemeStore>();

// Export singleton instance
export const themeStore = new ThemeStore();
