/* Copyright (c) 2025 @dxncrv
  Portfolio fx store - Demo purposes only
  License: CC BY-NC-ND 4.0
*/

export class CircleFx {
	#decay: any; #hide: any; #raf: any;
	#next = { x: 0, y: 0 };
	#last = { x: 0, y: 0 };

	BASE = 32;
	MAX_SIZE = 64;
	cursor = $state({ x: 0, y: 0, visible: false, size: 32 });

	#isOverColored(el: Element | null): boolean {
		if (!el || el === document.body) return false;
		const bg = getComputedStyle(el).backgroundColor;
		const isTransparent = !bg || bg === 'transparent' || bg.replace(/\s/g, '') === 'rgba(0,0,0,0)';
		return !isTransparent || this.#isOverColored(el.parentElement);
	}

	#process = () => {
		this.#raf = null;
		const { x, y } = this.#next;
		this.cursor.x = x; this.cursor.y = y;
		
		const dist = Math.hypot(x - this.#last.x, y - this.#last.y);
		this.cursor.size = Math.min(this.MAX_SIZE, Math.max(this.BASE, this.cursor.size + dist * 0.06));
		this.#last = { x, y };

		this.cursor.visible = !this.#isOverColored(document.elementFromPoint(x, y));
		
		clearTimeout(this.#hide);
		clearTimeout(this.#decay);
		this.#decay = setTimeout(() => {
			this.cursor.size = this.BASE;
			this.#hide = setTimeout(() => this.cursor.visible = false, 1000);
		}, 700);
	};

	onMove = (e: MouseEvent) => {
		this.#next = { x: e.clientX, y: e.clientY };
		if (!this.#raf) this.#raf = requestAnimationFrame(this.#process);
	};

	onLeave = () => {
		cancelAnimationFrame(this.#raf);
		this.#raf = null;
		this.cursor.visible = false;
		clearTimeout(this.#decay);
		clearTimeout(this.#hide);
	};

	destroy = () => this.onLeave();
}

export class TyperFx {
	state = $state({ text: '', typing: false, truncated: true });
	#cfg: { maxLength: number; speed: number };
	#int: any;
	#last = '';

	constructor(cfg: { maxLength?: number; speed?: number } = {}) {
		this.#cfg = { maxLength: cfg.maxLength ?? 30, speed: cfg.speed ?? 20 };
	}

	get buttonText() { return this.state.truncated ? 'More' : 'Less'; }
	showButton = (len: number) => len > this.#cfg.maxLength && !this.state.typing;
	toggle = () => this.state.truncated = !this.state.truncated;

	processText(full: string) {
		const dots = ' ...';
		const target = (!this.state.truncated || full.length <= this.#cfg.maxLength)
			? full
			: full.slice(0, Math.max(0, full.lastIndexOf(' ', this.#cfg.maxLength))) + dots;
		
		if (target === this.#last) return;
		
		clearInterval(this.#int);
		this.state.typing = true;

		const lastBase = this.#last.replace(dots, '');
		const targetBase = target.replace(dots, '');
		
		let from = 0;
		let isRev = false;

		if (target.startsWith(lastBase)) {
			from = lastBase.length;
		} else if (lastBase.startsWith(targetBase)) {
			isRev = true;
			from = this.#last.length;
		} else {
			this.state.text = '';
		}

		let i = from;
		this.#int = setInterval(() => {
			if (isRev) {
				if (this.state.text.length > target.length) this.state.text = this.state.text.slice(0, -1);
				else this.#finish(target);
			} else {
				if (i < target.length) this.state.text = target.slice(0, ++i);
				else this.#finish(target);
			}
		}, this.#cfg.speed / (isRev ? 2 : 1));
	}

	#finish(val: string) {
		clearInterval(this.#int);
		this.state.text = this.#last = val;
		this.state.typing = false;
	}

	destroy = () => clearInterval(this.#int);
}
