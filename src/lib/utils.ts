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

// Robust markdown parser for portfolio content
export function parseMarkdown(markdown: string): string {
    if (!markdown) return '';
    
    let html = markdown;
    
    // 1. Handle line breaks FIRST (two spaces at end of line)
    html = html.replace(/ {2,}\r?\n/g, '<br>');
    
    // 2. Convert headings (h1-h6)
    html = html.replace(/^#{6}\s*(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#{5}\s*(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#{4}\s*(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^#{3}\s*(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#{2}\s*(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#{1}\s*(.+)$/gm, '<h1>$1</h1>');
    
    // 3. Convert unordered lists (- or *)
    html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
    
    // 4. Convert ordered lists (1. 2. etc.)
    html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // 5. Wrap consecutive list items in appropriate list tags
    html = html.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, (match) => {
        // Check if this came from ordered or unordered list
        const originalLines = markdown.split('\n');
        let isOrdered = false;
        
        // Simple heuristic: if we find numbered lists in original, assume ordered
        for (let line of originalLines) {
            if (line.trim().match(/^\d+\.\s+/)) {
                isOrdered = true;
                break;
            }
        }
        
        return isOrdered ? `<ol>${match}</ol>` : `<ul>${match}</ul>`;
    });
    
    // 6. Handle inline formatting
    // Bold (strong) - **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic (emphasis) - *text* or _text_ (but not when surrounded by other * or _)
    html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');
    
    // Inline code - `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Images - ![alt](src) and ![alt](src "title")
    html = html.replace(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g, (match, alt, src, title) => {
        return title ? `<img src="${src}" alt="${alt}" title="${title}">` : `<img src="${src}" alt="${alt}">`;
    });
    // Links - [text](url) and [text](url "title")
    html = html.replace(/\[([^\]]+)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g, (match, text, url, title) => {
        return title ? `<a href="${url}" title="${title}">${text}</a>` : `<a href="${url}">${text}</a>`;
    });
    
    // 7. Handle blockquotes
    html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // 8. Handle horizontal rules
    html = html.replace(/^[-*_]{3,}$/gm, '<hr>');
    
    // 9. Convert paragraphs (group text by empty lines)
    const blocks = html.split(/\n\s*\n/);
    
    html = blocks
        .map(block => {
            const trimmed = block.trim();
            if (!trimmed) return '';
            
            // Skip blocks that are already wrapped in block-level elements
            if (trimmed.match(/^<(?:h[1-6]|ul|ol|li|blockquote|hr|div|p|pre|code)/i)) {
                return trimmed;
            }
            
            // If block contains only list items, wrap in appropriate list tag
            if (trimmed.match(/^<li>.*<\/li>$/s)) {
                return `<ul>${trimmed}</ul>`;
            }
            
            // Convert single newlines to spaces within paragraphs, but preserve <br> tags
            const paragraphContent = trimmed
                .split('<br>')
                .map(part => part.replace(/\s*\n\s*/g, ' ').trim())
                .join('<br>')
                .trim();
            
            return paragraphContent ? `<p>${paragraphContent}</p>` : '';
        })
        .filter(Boolean)
        .join('\n\n');
    
    // 10. Clean up any remaining issues
    html = html
        .replace(/<\/li>\s*<li>/g, '</li><li>') // Clean up list spacing
        .replace(/<\/blockquote>\s*<blockquote>/g, '</blockquote><blockquote>') // Clean up blockquote spacing
        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
        .trim();
    
    return html;
}