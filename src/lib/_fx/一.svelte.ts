/*
  Copyright (c) 2025 @dxncrv
  
  Portfolio fx store - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
*/

// CircleFx class to manage cursor circle state and behavior.
export class CircleFx {

	// Timers / RAF handles
	#decayTimeout: ReturnType<typeof setTimeout> | null = null;
	#hideTimeout: ReturnType<typeof setTimeout> | null = null;
	#raf: number | null = null;

	// Internal state
	#nextX = 0;
	#nextY = 0;
	#last = $state({ x: 0, y: 0 });

	// Tunables
	BASE = 32;
	MAX_SIZE = 64;
	SIZE_FACTOR = 0.06; // how much distance increases size
	DECAY_DELAY = 700;
	HIDE_DELAY = 1000;

	// Public reactive cursor state
	cursor = $state({ x: 0, y: 0, visible: false, size: this.BASE });

	constructor() {
		// Avoid initial jump
		this.#last.x = this.cursor.x;
		this.#last.y = this.cursor.y;
	}

	// Small helpers for clarity
	#clearTimeouts(...tids: Array<'decay' | 'hide'>) {
		for (const t of tids) {
			if (t === 'decay' && this.#decayTimeout) {
				clearTimeout(this.#decayTimeout);
				this.#decayTimeout = null;
			}
			if (t === 'hide' && this.#hideTimeout) {
				clearTimeout(this.#hideTimeout);
				this.#hideTimeout = null;
			}
		}
	}

	#clamp(v: number, min: number, max: number) {
		return Math.max(min, Math.min(max, v));
	}

	// Walk up DOM from point to see if any element has a non-transparent background.
	#isOverColoredBackground(el: Element | null) {
		while (el && el !== document.body) {
			const bg = getComputedStyle(el).backgroundColor;
			if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'inherit') return true;
			el = el.parentElement;
		}
		return false;
	}

	#resetSize = () => {
		this.cursor.size = this.BASE;
		this.#clearTimeouts('hide');
		this.#hideTimeout = setTimeout(() => (this.cursor.visible = false), this.HIDE_DELAY);
	};

	#scheduleDecay = () => {
		this.#clearTimeouts('hide');
		this.#clearTimeouts('decay');
		this.#decayTimeout = setTimeout(this.#resetSize, this.DECAY_DELAY);
	};

	#processMouse = () => {
		this.#raf = null;
		const x = this.#nextX;
		const y = this.#nextY;

		this.cursor.x = x;
		this.cursor.y = y;

		const dist = Math.hypot(x - this.#last.x, y - this.#last.y);
		this.cursor.size = this.#clamp(this.cursor.size + dist * this.SIZE_FACTOR, this.BASE, this.MAX_SIZE);

		this.#last.x = x;
		this.#last.y = y;

		const el = document.elementFromPoint(x, y);
		this.cursor.visible = !this.#isOverColoredBackground(el);

		this.#scheduleDecay();
	};

	// Public API
	onMove = (e: MouseEvent) => {
		this.#clearTimeouts('hide');
		this.#nextX = e.clientX;
		this.#nextY = e.clientY;
		if (this.#raf == null) this.#raf = requestAnimationFrame(this.#processMouse);
	};

	onLeave = () => {
		if (this.#raf) cancelAnimationFrame(this.#raf);
		this.#raf = null;
		this.cursor.visible = false;
		this.#clearTimeouts('decay', 'hide');
		this.#resetSize();
	};

	// Context7: /sveltejs/svelte@5.37.0 - Cleanup method for proper lifecycle management
	destroy = () => {
		if (this.#raf) cancelAnimationFrame(this.#raf);
		this.#clearTimeouts('decay', 'hide');
		this.#raf = null;
		this.#decayTimeout = null;
		this.#hideTimeout = null;
	};
}

// TyperFx class to manage typing effect state and behavior.
export class TyperFx {
	state = $state({ text: '', typing: false, truncated: true });
	get buttonText() { return this.state.truncated ? 'More' : 'Less'; }

	#cfg: { maxLength: number; speed: number };
	#int: ReturnType<typeof setInterval> | null = null;
	#last = $state('');
	#dots = ' ...';

	constructor(cfg: { maxLength?: number; speed?: number } = {}) {
		this.#cfg = { maxLength: cfg.maxLength ?? 30, speed: cfg.speed ?? 20 };
	}

	#finish(val: string) {
		this.state.text = val;
		if (this.#int) { clearInterval(this.#int); }
		this.state.typing = false;
		this.#last = val;
	}

	#params(target: string) {
		const base = this.#last.replace(this.#dots, '');
		if (!this.state.truncated && this.#last && target.startsWith(base)) return { from: base.length, rev: false };
		if (this.state.truncated && this.#last && !this.#last.includes(this.#dots) && target.includes(this.#dots)) return { from: 0, rev: true };
		return { from: 0, rev: false };
	}
	
	#run(target: string, from = 0, rev = false) {
		if (this.#int) { clearInterval(this.#int); }
		this.state.typing = true;
		if (!rev && from === 0) this.state.text = '';
		let i = rev ? this.state.text.length : from;
		const speed = this.#cfg.speed / (rev ? 2 : 1);
		this.#int = setInterval(() => {
			if (rev) {
				if (this.state.text.length > target.length) this.state.text = this.state.text.slice(0, -1);
				else this.#finish(target);
			} else {
				if (i < target.length) this.state.text = target.slice(0, ++i);
				else this.#finish(target);
			}
		}, speed);
	}

	showButton = (len: number) => len > this.#cfg.maxLength && !this.state.typing;
	toggle = () => { this.state.truncated = !this.state.truncated; };

	// Context7: /sveltejs/svelte@5.37.0 - Cleanup method for proper lifecycle management
	destroy = () => {
		if (this.#int) {
			clearInterval(this.#int);
			this.#int = null;
		}
	};

	processText(full: string) {
		const target = (!this.state.truncated || full.length <= this.#cfg.maxLength)
			? full
			: ((): string => {
				const cut = full.lastIndexOf(' ', this.#cfg.maxLength);
				const at = cut > 0 ? cut : this.#cfg.maxLength;
				return full.slice(0, at) + this.#dots;
			})();
		if (target === this.#last) return;
		const { from, rev } = this.#params(target) as { from: number; rev: boolean };
		this.#run(target, from, rev);
	}
}

/* Portfolio component by @dxncrv - https://dxncrv.com */
/* Created: 2025-08-08 - Do not use without permission */