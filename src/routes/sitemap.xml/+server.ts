import { RedisStore } from '$lib/server';

export async function GET() {
	try {
		const projects = await RedisStore.getProjects();

		const baseUrl = 'https://dxncrv.com';
		const today = new Date().toISOString().split('T')[0];

		// Generate sitemap XML with current date as lastmod
		// Filter to only projects with study content for dynamic pages
		const studyProjects = projects.filter(p => p.study);
		
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
	${studyProjects
		.map(
			(p) => `
	<url>
		<loc>${baseUrl}/projects/${p.slug || p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}</loc>
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
