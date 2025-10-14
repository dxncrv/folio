<script>
	import 'iconify-icon';
	import { Circle } from '$lib';
	import Grainy from '$lib/_fx/Grainy.svelte';
	import Header from '$lib/components/header.svelte';
	import Timemachine from '$lib/components/timemachine.svelte';
	import StatusCheck from '$lib/dxn-svr/server-check.svelte';
</script>
<svelte:head>
		<link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>
<Header />
<slot />
<footer>
	<a href="https://github.com/users/dxncrv/projects/3" target="_blank" rel="noopener noreferrer"
		>Under intermittent development 🚧
	</a>
	<a href="/start" aria-label="start page">
		<StatusCheck />
	</a>
	<p>© 2024 - handmade with ♡ by @dxncrv</p>
</footer>
<Timemachine/>
<Circle />
<Grainy/>
