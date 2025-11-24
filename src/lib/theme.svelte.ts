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
		if (browser) {
			// Check cookie first to handle prerendered pages where data-theme might be stale
			const cookieMatch = document.cookie.match(/theme=([^;]+)/);
			const cookieTheme = cookieMatch ? cookieMatch[1] as Theme : null;
			const domTheme = document.documentElement.getAttribute('data-theme') as Theme;
			
			// Prioritize cookie, then DOM, then default to dark
			const initialTheme = cookieTheme || domTheme || 'dark';
			this.theme = initialTheme;

			// Ensure DOM is in sync if we found a cookie that differs from the static HTML
			if (initialTheme !== domTheme) {
				document.documentElement.setAttribute('data-theme', initialTheme);
			}
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
