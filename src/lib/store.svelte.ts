import data from './projects.json';
import type { Project, Facet } from './types';

// Facets class to manage the filter state of the projects.
class facetsClass {
	// State store for the facets
	facets = $state<Facet[]>([
		{ name: 'Code', bool: true },
		{ name: 'Design', bool: true },
	]);
	// toggle method manages the state of the facets, toggling 'bool' value of the 'name' parameter
	toggle(name: string) {
		this.facets = this.facets.map((f) => (f.name === name ? { ...f, bool: !f.bool } : f));
		if (Projects.range.min > Projects.selected.length - 1) {
			Projects.range.reset();
		}
	}
	// selected method returns the selected facets as an array ['name1', 'name2', ...]
	selected() {
		return this.facets.filter((f) => f.bool).map((f) => f.name);
	}
}
// Export the Facets class as a singleton instance.
export const Facets = new facetsClass();

// Projects class to manage the projects state and pagination.
class projectsClass {
	// PRIVATE all, state for the projects, fetched from the JSON file.
	#all = $state<Project[]>(data as Project[]);
	// PUBLIC range, state for pagination.
	range = $state({
		min: 0,
		max: 3,
		prev: () => {
			this.range.min -= 3;
			this.range.max -= 3;
		},
		next: () => {
			this.range.min += 3;
			this.range.max += 3;
		},
		reset: () => {
			this.range.min = 0;
			this.range.max = 3;
		}
	});
	// PUBLIC selected, derived state returns the projects based on the selected facets.
	selected = $derived.by(() => {
		// Get the selected facets
		const selectedFacets = Facets.selected();
		// Filter the projects based on the selected facets and return the projects with the 'desc' and 'tech' properties updated.
		return this.#all
			.filter(project => project.tags.some(tag => selectedFacets.includes(tag)))
			.map(project => ({
				...project,
				desc: selectedFacets.map(facet => project.desc[facet.toLowerCase()]).join(' '),
				tech: selectedFacets.flatMap(facet => project.tags.includes(facet) ? project.tech[facet.toLowerCase()] : [])
			}))
	});
}
// Export the Projects class as a singleton instance.
export let Projects = new projectsClass();

// TypewriterEffect class to manage typewriter animation state and behavior.
class typewriterEffectClass {
	// PRIVATE configuration and state
	#config: { maxLength: number; typingSpeed: number; backspaceSpeed: number };
	#currentInterval: number | null = null;
	#memoryState = $state('');
	#lastProcessedDesc = $state('');

	// PUBLIC state
	text = $state('');
	isTyping = $state(false);
	isTruncated = $state(true);

	constructor(maxLength = 30, typingSpeed = 20, backspaceSpeed = 10) {
		this.#config = { maxLength, typingSpeed, backspaceSpeed };
	}

	// toggle method manages the truncation state
	toggle() {
		this.isTruncated = !this.isTruncated;
	}

	// PRIVATE method for truncation and animation control
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
		const speed = reverse ? this.#config.backspaceSpeed : this.#config.typingSpeed;

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

	// PUBLIC method to process text changes and trigger appropriate animation
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

	// PUBLIC utility methods
	shouldShowButton = (fullTextLength: number) => fullTextLength > this.#config.maxLength && !this.isTyping;
	getButtonText = () => this.isTruncated ? 'More' : 'Less';
	destroy = () => this.#finish('');
}

// Export factory function to create typewriter instances
export let createTypewriter = (maxLength?: number, typingSpeed?: number, backspaceSpeed?: number) => 
	new typewriterEffectClass(maxLength, typingSpeed, backspaceSpeed);