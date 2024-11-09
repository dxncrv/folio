// Imports
import type { SubmitFunction } from '@sveltejs/kit';
// <-- This section has utils for the [dot] element, [theme] form in [header.svelte] -->

// Function to move the dot element to the active element
export const moveDot = (e: HTMLElement | null) => {
	// Get the dot element
	const dot = document.querySelector('.dot') as HTMLElement;
	if (!dot || !e) return;
	dot.style.opacity = '1'; // makes the dot visible
	dot.style.translate = `calc(${e.offsetLeft + e.offsetWidth / 2}px - 100%) 150%`; // positions the dot at the center of (e)
};

// Function to initialize the dot element in the DOM
export const initDot = () => {
	// get active element and move the dot to it
	const e = document.querySelector('.active') as HTMLElement | null;
	moveDot(e);
};

// Submit function, gets the theme from the form and sets it as the document theme
export const updateTheme: SubmitFunction = ({ action }) => {
	const theme = action.searchParams.get('theme');

	if (theme) {
		document.documentElement.setAttribute('data-theme', theme);
	}
};
