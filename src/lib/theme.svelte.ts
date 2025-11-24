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
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';
export type BlendMode = 'color-dodge' | 'color-burn';

class ThemeStore {
	// Current active theme
	theme = $state<Theme>('dark');

	// Derived blend mode based on theme
	blendMode = $derived<BlendMode>(this.theme === 'light' ? 'color-dodge' : 'color-burn');

	constructor() {
		// Initialize from document on browser
		// The inline script in app.html has already set the correct theme
		if (browser) {
			const initialTheme = (document.documentElement.getAttribute('data-theme') || 'dark') as Theme;
			this.theme = initialTheme;
		}
	}

	set(newTheme: Theme) {
		this.theme = newTheme;
		if (browser) {
			document.documentElement.setAttribute('data-theme', newTheme);
			// Set cookie for 1 year
			document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
		}
	}

	toggle() {
		this.set(this.theme === 'light' ? 'dark' : 'light');
	}
}

// Create the context for theme
export const [getThemeStore, setThemeStore] = createContext<ThemeStore>();

// Export singleton instance
export const themeStore = new ThemeStore();
