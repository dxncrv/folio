// Imports
import type { SubmitFunction } from '@sveltejs/kit';

// Submit function, gets the theme from the form and sets it as the document theme
export const updateTheme: SubmitFunction = ({ action }) => {
	const theme = action.searchParams.get('theme');

	if (theme) {
		document.documentElement.setAttribute('data-theme', theme);
	}
};

// Function to slugify a string
export function slugify(str: string) {
		return str
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
}

// Function to parse markdown into HTML
export function parseMarkdown(markdown: string): string {
    if (!markdown) return '';

    // Normalize line endings and split into blocks
    const blocks = markdown
        .replace(/\r\n/g, '\n') 
        .split(/\n{2,}/); 

    // Processing each block
    const htmlBlocks = blocks.map(block => {
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

        // 3. Blockquotes - `>`
        if (block.startsWith('>')) {
            const content = block.split('\n').map(line => line.replace(/^>\s?/, '')).join('\n');
            return `<blockquote>${parseMarkdown(content)}</blockquote>`;
        }

        // 4. Lists (unordered or ordered) - `*`, `+`, `-` for unordered, and `1.`, `2.`, etc. for ordered
        if (/^([*+-]|\d+\.)\s/.test(block)) {
            const lines = block.split('\n');
            const isOrdered = /^\d+\.\s/.test(lines[0]);
            const tag = isOrdered ? 'ol' : 'ul';
            
            const items = lines.map(line => {
                // Strips *, +, -, or #. from the start of the line
                const itemContent = line.replace(/^([*+-]|\d+\.)\s+/, '');
                return `<li>${parseInline(itemContent)}</li>`;
            }).join('');
            
            return `<${tag}>${items}</${tag}>`;
        }

        // 5. Standalone Image or Video - `![alt](src)` or `!![alt](src)`
        if (/^!?\!\[[^\]]*\]\([^)]+\)\s*$/.test(block)) {
            return parseInline(block);
        }

        // 6. Treats remaining text as a paragraph
        const pContent = block.replace(/ {2,}\n/g, '<br>\n');
        return `<p>${parseInline(pContent)}</p>`;
    });

    return htmlBlocks.filter(Boolean).join('\n');
}

// Parses inline markdown elements like images, links, strong/emphasis, and inline code.
function parseInline(text: string): string {
    let html = text;

    // Videos, Images, Links - `!![alt](src)`, `![alt](src)`, `[text](url)`
    html = html.replace(/!!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) => 
        title ? `<video controls src="${src}" alt="${alt}" title="${title}"></video>` : `<video controls src="${src}" alt="${alt}"></video>`
    );
    html = html.replace(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) => 
        title ? `<img src="${src}" alt="${alt}" title="${title}">` : `<img src="${src}" alt="${alt}">`
    );
    html = html.replace(/\[([^\]]+)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g, (_, linkText, url, title) => 
        title ? `<a href="${url}" title="${title}">${linkText}</a>` : `<a href="${url}">${linkText}</a>`
    );

    // Strong/Emphasis
    html = html.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, '<strong>$1$2</strong>');
    html = html.replace(/\*([^*]+)\*|_([^_]+)_/g, '<em>$1$2</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Treat remaining newlines as spaces
    return html.replace(/\n/g, ' ');
}