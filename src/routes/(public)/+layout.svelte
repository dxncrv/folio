<script>
	import 'iconify-icon';
	import Header from '$lib/components/header.svelte';
	import Timemachine from '$lib/components/timemachine.svelte';
	import { Circle } from '$lib';
</script>
<svelte:head>
		<link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>
<Header />
<slot />
<footer>
	<p>
	<iconify-icon icon="ic:twotone-copyright" width="18" height="18" aria-label="copyright"></iconify-icon>
		2025 with ♡ by @dxncrv
	<a href="/start" aria-label="start page">
		<iconify-icon icon="ic:twotone-admin-panel-settings" width="18" height="18" aria-label="start page"></iconify-icon>
	</a>
	</p>
</footer>

<style>
	footer p {
		display: flex;
		align-items: center;
		min-height: 24px;
		gap: 0.5rem;
	}
</style>
<Timemachine/>
<Circle />
