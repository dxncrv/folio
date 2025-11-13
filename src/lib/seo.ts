/**
 * SEO utilities for consistent metadata generation across the site
 * Ensures proper indexing and social sharing across all pages
 */

export interface MetaTagOptions {
	title: string;
	description: string;
	canonical?: string;
	ogImage?: string;
	ogImageWidth?: number;
	ogImageHeight?: number;
	type?: 'website' | 'article' | 'profile';
	keywords?: string[];
	author?: string;
	datePublished?: string;
	dateModified?: string;
}

export interface StructuredDataPerson {
	'@context': 'https://schema.org';
	'@type': 'Person';
	name: string;
	url: string;
	jobTitle?: string;
	description?: string;
	image?: string;
	sameAs?: string[];
	knowsAbout?: string[];
}

export interface StructuredDataArticle {
	'@context': 'https://schema.org';
	'@type': 'Article' | 'BlogPosting';
	headline: string;
	description?: string;
	author: {
		'@type': 'Person';
		name: string;
	};
	image?: string;
	datePublished?: string;
	dateModified?: string;
	keywords?: string;
	articleBody?: string;
}

export interface StructuredDataBreadcrumb {
	'@context': 'https://schema.org';
	'@type': 'BreadcrumbList';
	itemListElement: Array<{
		'@type': 'ListItem';
		position: number;
		name: string;
		item: string;
	}>;
}

/**
 * Base URL for the site - used for canonical URLs and absolute paths
 */
export const SITE_URL = 'https://dxncrv.com';

/**
 * Site owner information for structured data
 */
export const SITE_AUTHOR = {
	name: 'Aashay Mehta',
	jobTitle: 'UX Engineer',
	url: SITE_URL,
	socials: [
		'https://github.com/dxncrv',
		'https://www.linkedin.com/in/dxncrv/',
		'https://www.instagram.com/dxncrv/'
	]
};

/**
 * Default Open Graph image
 */
export const DEFAULT_OG_IMAGE = '/static/assets/aashay.jpg';

/**
 * Generate canonical URL from path
 */
export function getCanonicalUrl(path: string): string {
	// Remove trailing slash for consistency (SvelteKit handles this but for meta tags)
	const cleanPath = path === '/' ? '' : path.replace(/\/$/, '');
	return `${SITE_URL}${cleanPath}`;
}

/**
 * Generate Person structured data for about/profile pages
 */
export function generatePersonSchema(
	options?: Partial<StructuredDataPerson>
): StructuredDataPerson {
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: SITE_AUTHOR.name,
		url: SITE_AUTHOR.url,
		jobTitle: SITE_AUTHOR.jobTitle,
		sameAs: SITE_AUTHOR.socials,
		...options
	};
}

/**
 * Generate Article structured data for blog posts and case studies
 */
export function generateArticleSchema(options: {
	headline: string;
	description?: string;
	image?: string;
	datePublished?: string;
	dateModified?: string;
	keywords?: string;
	articleBody?: string;
	type?: 'Article' | 'BlogPosting';
}): StructuredDataArticle {
	return {
		'@context': 'https://schema.org',
		'@type': options.type || 'Article',
		headline: options.headline,
		description: options.description,
		author: {
			'@type': 'Person',
			name: SITE_AUTHOR.name
		},
		image: options.image,
		datePublished: options.datePublished,
		dateModified: options.dateModified,
		keywords: options.keywords,
		articleBody: options.articleBody
	};
}

/**
 * Generate BreadcrumbList structured data for navigation
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): StructuredDataBreadcrumb {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: getCanonicalUrl(item.url)
		}))
	};
}

/**
 * Escape content for safe JSON-LD embedding
 */
export function escapeJsonLd(str: string): string {
	return str
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t');
}
