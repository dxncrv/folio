<script>
	import 'iconify-icon';
	import Header from '$lib/components/header.svelte';
	import '../app.css';
	import Timemachine from '$lib/components/timemachine.svelte';
	import { page } from '$app/stores';

	$: isErrorPage = $page.error;
</script>

{#if !isErrorPage}
	<Header />
{/if}

<slot />

{#if !isErrorPage}
	<footer>
		<a href="https://github.com/users/dxncrv/projects/3" target="_blank" rel="noopener noreferrer"
			>Under intermittent development 🚧
		</a>
		<p>© 2024 - handmade with ♡ by @dxncrv</p>
	</footer>
	<Timemachine />
{/if}
