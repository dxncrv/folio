<script>
	import '../app.css';
	import { setThemeStore, themeStore } from '$lib/theme.svelte';

	// Initialize theme context for all child components
	setThemeStore(themeStore);
</script>

<svelte:head>
	<meta name="author" content="Aashay Mehta" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Aashay Mehta Portfolio" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<slot/>