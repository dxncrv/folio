/*
  Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
*/
// CircleFx class to manage cursor circle state and behavior.
class CircleFx {
	// PRIVATE FIELDS
	#decayTimeout: ReturnType<typeof setTimeout> | null = null;
	#hideTimeout: ReturnType<typeof setTimeout> | null = null;
	#raf: number | null = null;
	#nextX = 0;
	#nextY = 0;
	#last = $state({ x: 0, y: 0 });

	// PUBLIC FIELDS
	BASE = 32;
	cursor = $state({ x: 0, y: 0, visible: false, size: this.BASE });

	// CONSTRUCTOR
	constructor() {
		// Avoid an initial jump
		this.#last.x = this.cursor.x;
		this.#last.y = this.cursor.y;
	}

	// PRIVATE METHODS
	#isBgColored = (el: Element | null) =>
		el ? !['transparent', 'rgba(0, 0, 0, 0)', 'inherit'].includes(getComputedStyle(el).backgroundColor) : false;

	#resetSize = () => {
		this.cursor.size = this.BASE;
		if (this.#hideTimeout) clearTimeout(this.#hideTimeout);
		this.#hideTimeout = setTimeout(() => {
			this.cursor.visible = false;
		}, 1000);
	};

	#scheduleDecay = () => {
		if (this.#hideTimeout) clearTimeout(this.#hideTimeout);
		this.#hideTimeout = null;
		if (this.#decayTimeout) clearTimeout(this.#decayTimeout);
		this.#decayTimeout = setTimeout(this.#resetSize, 700);
	};

	#processMouse = () => {
		this.#raf = null;
		const x = this.#nextX;
		const y = this.#nextY;

		// update visible position used by the DOM
		this.cursor.x = x;
		this.cursor.y = y;

		const dist = Math.hypot(x - this.#last.x, y - this.#last.y);
		this.cursor.size = Math.max(this.BASE, Math.min(64, this.cursor.size + dist * 0.06));
		this.#last.x = x;
		this.#last.y = y;

		// determine if cursor should hide over a non-transparent background
		let el = document.elementFromPoint(x, y);
		while (el && el !== document.body && !this.#isBgColored(el)) el = el.parentElement;
		this.cursor.visible = !(el && el !== document.body);

		this.#scheduleDecay();
	};

	// PUBLIC METHODS
	onMove = (e: MouseEvent) => {
		if (this.#hideTimeout) clearTimeout(this.#hideTimeout);
		this.#hideTimeout = null;
		this.#nextX = e.clientX;
		this.#nextY = e.clientY;
		if (this.#raf == null) this.#raf = requestAnimationFrame(this.#processMouse);
	};

	onLeave = () => {
		if (this.#raf) cancelAnimationFrame(this.#raf);
		this.#raf = null;
		this.cursor.visible = false;
		if (this.#decayTimeout) clearTimeout(this.#decayTimeout);
		this.#resetSize();
		if (this.#hideTimeout) clearTimeout(this.#hideTimeout);
	};
}

// Export factory function to create cursor circle instances
export let createCircle = () => new CircleFx();

/* Portfolio component by @dxncrv - https://dxncrv.com */
/* Created: 2025-08-08 - Do not use without permission */
