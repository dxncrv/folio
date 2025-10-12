// Context7: /sveltejs/kit - Robots.txt for SEO
export async function GET() {
	const robotsTxt = `User-agent: *
Allow: /

# Disallow admin areas
Disallow: /start
Disallow: /start/*
Disallow: /api/

# Sitemap
Sitemap: https://aashaymehta.com/sitemap.xml`;

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=86400'
		}
	});
}
