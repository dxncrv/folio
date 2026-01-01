/**
 * Parse markdown string into HTML
 * 
 * Supported syntax:
 * - Headings: # H1, ## H2, etc.
 * - Lists: *, +, - or 1., 2., etc.
 * - Blockquotes: >
 * - Images: ![alt](src)
 * - Videos: !![alt](src)
 * - Links: [text](url)
 * - Strong: **text** or __text__
 * - Emphasis: *text* or _text_
 * - Code: `code`
 * - Horizontal rule: ---, ***, ___
 * - Accordions: >>> Title content\nBody content\n<<<
 * 
 * @param markdown - Raw markdown string
 * @param inBlockquote - Whether we're parsing inside a blockquote (prevents nested paragraphs)
 * @returns HTML string
 */
export function parseMarkdown(markdown: string, inBlockquote = false): string {
	if (!markdown) return '';

	// Normalize line endings
	let normalized = markdown.replace(/\r\n/g, '\n');

	// Process accordions first (they can span multiple blocks)
	normalized = processAccordions(normalized);

	// Split into blocks
	const blocks = normalized.split(/\n{2,}/);

	// Processing each block
	const htmlBlocks = blocks.map((block) => {
		block = block.trim();
		if (!block) return '';

		// 1. Headings (h1-h6) - `#`, `##`, `###`, etc.
		const headingMatch = block.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const content = parseInline(headingMatch[2]);
			return `<h${level}>${content}</h${level}>`;
		}

		// 2. Horizontal Rule - `---`, `***`, or `___`
		if (/^[-*_]{3,}$/.test(block)) {
			return '<hr>';
		}

		// 3. Blockquotes - `>` (including multi-line)
		if (block.startsWith('>') || block.includes('\n>')) {
			const content = block
				.split('\n')
				.map((line) => line.replace(/^>\s?/, ''))
				.join(' ');
			return `<blockquote>${parseInline(content)}</blockquote>`;
		}

		// 4. Lists (unordered or ordered) - `*`, `+`, `-` for unordered, and `1.`, `2.`, etc. for ordered
		if (/^([*+-]|\d+\.)\s/.test(block)) {
			const lines = block.split('\n');
			const isOrdered = /^\d+\.\s/.test(lines[0]);
			const tag = isOrdered ? 'ol' : 'ul';

			const items = lines
				.map((line) => {
					// Strips *, +, -, or #. from the start of the line
					const itemContent = line.replace(/^([*+-]|\d+\.)\s+/, '');
					return `<li>${parseInline(itemContent)}</li>`;
				})
				.join('');

			return `<${tag}>${items}</${tag}>`;
		}

		// 5. Standalone Image or Video - `![alt](src)` or `!![alt](src)`
		if (/^!?\!\[[^\]]*\]\([^)]+\)\s*$/.test(block)) {
			return parseInline(block);
		}

		// 6. Skip accordion blocks (already processed)
		if (block.startsWith('<details class="accordion"')) {
			return block;
		}

		// 7. Treats remaining text as a paragraph
		const pContent = block.replace(/ {2,}\n/g, '<br>\n');
		return `<p>${parseInline(pContent)}</p>`;
	});

	return htmlBlocks.filter(Boolean).join('\n');
}

/**
 * Processes accordion blocks in markdown.
 * Syntax: >>> Title\nContent\n<<<
 * 
 * @param text - Markdown text that may contain accordion blocks
 * @returns Text with accordion blocks converted to HTML
 */
function processAccordions(text: string): string {
	const accordionPattern = />>>\s*([^\n]+)\n([\s\S]*?)(?:<<<|(?=>>>)|$)/g;
	
	return text.replace(accordionPattern, (_, title, content) => {
		// Parse inline markdown in title
		const parsedTitle = parseInline(title.trim());
		// Parse content as full markdown (recursively)
		const parsedContent = parseMarkdown(content.trim());
		// Generate unique ID for accordion
		const id = `accordion-${Math.random().toString(36).substr(2, 9)}`;
		
		return `<details class="accordion" data-accordion-id="${id}">
			<summary class="accordion-title">${parsedTitle}</summary>
			<div class="accordion-content">${parsedContent}</div>
		</details>`;
	});
}

/**
 * Parses inline markdown elements like images, links, strong/emphasis, and inline code.
 * 
 * @param text - Text with inline markdown syntax
 * @returns HTML string with inline elements converted
 */
function parseInline(text: string): string {
	let html = text;

	// Videos, Images, Links - `!![alt](src)`, `![alt](src)`, `[text](url)`
	html = html.replace(/!!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) =>
		title
			? `<video controls src="${src}" alt="${alt}" title="${title}"></video>`
			: `<video controls src="${src}" alt="${alt}"></video>`
	);
	html = html.replace(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) => {
		const img = title
			? `<img src="${src}" alt="${alt}" title="${title}" class="loading" onload="this.parentElement.classList.remove('shimmer'); this.classList.remove('loading')">`
			: `<img src="${src}" alt="${alt}" class="loading" onload="this.parentElement.classList.remove('shimmer'); this.classList.remove('loading')">`;
		return `<span class="shimmer img-wrapper">${img}</span>`;
	});
	html = html.replace(/\[([^\]]+)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g, (_, linkText, url, title) =>
		title
			? `<a href="${url}" title="${title}">${linkText}</a>`
			: `<a href="${url}">${linkText}</a>`
	);

	// Strong/Emphasis
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
	html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

	// Inline code
	html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

	// Normalize multiple spaces to single space, treat newlines as spaces
	return html.replace(/\n/g, ' ').replace(/  +/g, ' ');
}
