
<script lang="ts">
	interface Social {
		href: string;
		icon: string;
		label: string;
	}

	const socials: Social[] = [
		{ href: "mailto:hello@dxncrv.com", icon: "line-md:email", label: "Email" },
		{ href: "https://github.com/dxncrv", icon: "line-md:github-twotone", label: "GitHub" },
		// { href: "https://www.linkedin.com/in/dxncrv/", icon: "line-md:linkedin", label: "LinkedIn" },
		// { href: "https://www.instagram.com/dxncrv/", icon: "line-md:instagram", label: "Instagram" }
	];
</script>

<div class="socials">
	{#each socials as social}
		{@render socialLink(social)}
	{/each}
</div>

{#snippet socialLink(social: Social)}
	<a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
		<iconify-icon icon={social.icon} width="28" height="28"></iconify-icon>
	</a>
{/snippet}

<style>.socials{margin:0 2rem;display:flex;color:var(--accent-dim);gap:1.5rem}.socials a{font-size:1.5rem;color:var(--accent-dim);transition:color 0.2s}.socials a:hover{color:var(--accent)}</style>