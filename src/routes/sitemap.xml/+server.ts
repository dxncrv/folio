import { RedisStore } from '$lib/server/redis.server';
import { slugify } from '$lib/formatting';

// Context7: /sveltejs/kit - Sitemap generation for SEO
export async function GET() {
	try {
		const [projects, caseStudies] = await Promise.all([
			RedisStore.getProjects(),
			RedisStore.getCaseStudies()
		]);

		const baseUrl = 'https://aashaymehta.com'; // Update with your actual domain
		const today = new Date().toISOString().split('T')[0];

		// Generate sitemap XML
		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<!-- Static pages -->
	<url>
		<loc>${baseUrl}/</loc>
		<lastmod>${today}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>1.0</priority>
	</url>
	<url>
		<loc>${baseUrl}/about</loc>
		<lastmod>${today}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.8</priority>
	</url>
	<url>
		<loc>${baseUrl}/projects</loc>
		<lastmod>${today}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>0.9</priority>
	</url>
	
	<!-- Dynamic case study pages -->
	${caseStudies
		.map(
			(cs) => `
	<url>
		<loc>${baseUrl}/projects/${cs.slug}</loc>
		<lastmod>${today}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.7</priority>
	</url>`
		)
		.join('')}
</urlset>`;

		return new Response(sitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=3600, s-maxage=7200'
			}
		});
	} catch (error) {
		console.error('Failed to generate sitemap:', error);
		return new Response('Error generating sitemap', { status: 500 });
	}
}
