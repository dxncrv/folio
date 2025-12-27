<script>
	import 'iconify-icon';
	import { Circle } from '$lib';
	import Grainy from '$lib/_fx/Grainy.svelte';
	import Header from '$lib/components/header.svelte';
	import Timemachine from '$lib/components/timemachine.svelte';
</script>
<svelte:head>
		<link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>
<Header />
<slot />
<footer>
	<a href="https://github.com/users/dxncrv/projects/3" target="_blank" rel="noopener noreferrer"
		aria-label="kanban">
		<iconify-icon icon="line-md:check-list-3-filled" width="18" height="18" aria-label="project board"></iconify-icon>
	</a>
	<p>© 2025 with ♡ by @dxncrv</p>
	<a href="/start" aria-label="start page">
		<iconify-icon icon="hugeicons:login-method" width="18" height="18" aria-label="start page"></iconify-icon>
	</a>
</footer>
<Timemachine/>
<Circle />
<!-- <Grainy/> -->
