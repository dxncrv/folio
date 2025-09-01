<script>
	import 'iconify-icon';
	import { Circle } from '$lib';
	import Header from '$lib/components/header.svelte';
	import Timemachine from '$lib/components/timemachine.svelte';
	import Grainy from '$lib/_libfx/Grainy.svelte';
</script>

<Header />
<slot />
<footer>
	<a href="https://github.com/users/dxncrv/projects/3" target="_blank" rel="noopener noreferrer"
		>Under intermittent development 🚧
	</a>
	<p>© 2024 - handmade with ♡ by @dxncrv</p>
</footer>
<Timemachine/>
<Circle />
<Grainy/>
