// <-- This section has utils for the dot element used in the navigation bar -->

// JSDoc comments
/**
 * Function to move the dot element to the active element
 * @param {HTMLElement} e - The active element
 */

// Function to move the dot element to the active element
export const moveDot = (e) => {
	// Get the dot element
	const dot = document.querySelector('.dot');
	if (!dot || !e) return;
	dot.style.opacity = '1'; // makes the dot visible
	dot.style.translate = `calc(${e.offsetLeft + e.offsetWidth / 2}px - 100%) 150%`; // positions the dot at the center of (e)
};

// Function to initialize the dot element in the DOM
export const initDot = () => {
	// get active element and move the dot to it
	const e = document.querySelector('.active');
	moveDot(e);
};

// <-- This section has utils for [] -->
