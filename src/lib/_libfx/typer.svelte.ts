/*
  Copyright (c) 2025 @dxncrv
  
  Portfolio component - Demo purposes only
  License: CC BY-NC-ND 4.0
  
  View/reference for learning only. No commercial use, modifications, or redistribution.
  Commercial licensing: hello@dxncrv.com
*/
// typerFx class to manage typewriter animation state and behavior.
class typerFx {
	// PRIVATE FIELDS
	#config: { maxLength: number; speed: number };
	#currentInterval: number | null = null;
	#memoryState = $state('');
	#lastProcessedDesc = $state('');
	// PUBLIC FIELDS
	text = $state('');
	isTyping = $state(false);
	isTruncated = $state(true);

	// CONSTRUCTOR
	constructor(config: { maxLength?: number; speed?: number } = {}) {
		this.#config = {
			maxLength: config.maxLength ?? 30,
			speed: config.speed ?? 20
		};
	}

	// PRIVATE METHODS
	#getTruncated = (text: string) => {
		if (text.length <= this.#config.maxLength) return text;
		const cutPoint = text.lastIndexOf(' ', this.#config.maxLength);
		return text.slice(0, cutPoint > 0 ? cutPoint : this.#config.maxLength) + ' ...';
	};
	#finish = (finalText: string) => {
		if (this.#currentInterval) clearInterval(this.#currentInterval);
		this.#currentInterval = null;
		this.isTyping = false;
		this.#memoryState = this.#lastProcessedDesc = finalText;
	};
	#animate = (targetText: string, startIndex = 0, reverse = false) => {
		if (this.#currentInterval) clearInterval(this.#currentInterval);
		this.#currentInterval = null;
		this.isTyping = true;
		if (!reverse && startIndex === 0) this.text = '';
		let currentIndex = reverse ? this.text.length : startIndex;
		const speed = reverse ? this.#config.speed / 2 : this.#config.speed;
		this.#currentInterval = setInterval(() => {
			if (reverse) {
				if (this.text.length > targetText.length) {
					this.text = this.text.slice(0, -1);
				} else {
					this.text = targetText;
					this.#finish(targetText);
				}
			} else {
				if (currentIndex < targetText.length) {
					this.text = targetText.slice(0, ++currentIndex);
				} else {
					this.#finish(targetText);
				}
			}
		}, speed);
	};

	// PUBLIC METHODS
	toggle = () => { this.isTruncated = !this.isTruncated; }
	showButton = (fullTextLength: number) => fullTextLength > this.#config.maxLength && !this.isTyping;
	getButtonText = () => this.isTruncated ? 'More' : 'Less';
	processText(fullText: string) {
		const targetText = this.isTruncated && fullText.length > this.#config.maxLength 
			? this.#getTruncated(fullText) : fullText;
		if (targetText === this.#lastProcessedDesc) return;
		const isExpanding = !this.isTruncated && this.#memoryState && 
			targetText.startsWith(this.#memoryState.replace(' ...', ''));
		const isTruncating = this.isTruncated && this.#memoryState && 
			!this.#memoryState.includes(' ...') && targetText.includes(' ...');
		if (isExpanding) {
			this.#animate(targetText, this.#memoryState.replace(' ...', '').length, false);
		} else if (isTruncating) {
			this.#animate(targetText, 0, true);
		} else {
			this.#animate(targetText, 0, false);
		}
	}
}

// Export factory function to create typewriter instances
export let createTyper = (config?: { maxLength?: number; speed?: number }) => 
	new typerFx(config);

/* Portfolio component by @dxncrv - https://dxncrv.com */
/* Created: 2025-08-08 - Do not use without permission */