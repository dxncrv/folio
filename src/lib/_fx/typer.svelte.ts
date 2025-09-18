/*
  Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
*/

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