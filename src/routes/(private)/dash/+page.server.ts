import projectsData from '$lib/projects.json';

export const load = async ({ getClientAddress }: { getClientAddress: () => string }) => {
	const clientIP = getClientAddress();
	
	// Calculate real stats from your data
	const totalProjects = projectsData.length;
	const totalTags = [...new Set(projectsData.flatMap((p) => p.tags))].length;
	
	// Get recent projects
	const recentProjects = projectsData.slice(0, 3).map((p) => ({
		title: p.title,
		tags: p.tags
	}));
	
	// You can add visitor tracking here later (e.g., from a database or analytics)
	// For now, we'll simulate some basic stats
	const totalVisitors = Math.floor(Math.random() * 1000) + 500; // Replace with real analytics
	
	return {
		clientIP,
		timestamp: new Date().toISOString(),
		stats: {
			totalVisitors,
			totalProjects,
			totalTags,
			lastUpdated: new Date().toISOString(),
			recentProjects
		}
	};
};
