<script>
	import { Git } from '$lib/icons';
	import Header from '$lib/components/header.svelte';
	import '../app.css';
</script>

<Header />
<slot />
<footer>
	<a href="https://github.com/users/dxncrv/projects/3" target="_blank" rel="noopener noreferrer"
		><Git /> - view project board on GitHub
	</a>
	<p>© 2024 - handmade with ♥ by @dxncrv</p>
</footer>
