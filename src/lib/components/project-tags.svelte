<script lang="ts">
	let { tech } = $props<{ tech: { [key: string]: string[] | undefined } }>();
	
	let showDropdown = $state(false);
	let dropdownRef = $state<HTMLDivElement>();
	
	const TECH_ICONS = {
		'Svelte': 'material-icon-theme:svelte',
		'TypeScript': 'material-icon-theme:typescript',
		'Figma': 'material-icon-theme:figma',
		'Blender': 'logos:blender',
		'Photoshop': 'logos:adobe-photoshop',
		'After Effects': 'logos-adobe-after-effects',
		'Illustrator': 'logos:adobe-illustrator',
		'Premiere Pro': 'logos:adobe-premiere',
		'Unity': 'material-icon-theme:unity',
		'C Sharp': 'material-icon-theme:csharp',
		'Rhino': 'simple-icons:rhinoceros',
        'Git': 'material-icon-theme:git'
	};
	
	const allTech = $derived(() => {
		if (!tech) return [];
		return Object.values(tech).flat().filter(Boolean) as string[];
	});
	
	const visibleTech = $derived(() => allTech().slice(0, 4));
	const hiddenTech = $derived(() => allTech().slice(4));
	const hasMoreTech = $derived(() => hiddenTech().length > 0);
	
	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			showDropdown = false;
		}
	}
	
	function toggleDropdown(event: MouseEvent) {
		event.stopPropagation();
		showDropdown = !showDropdown;
	}
	
	$effect(() => {
		if (showDropdown) {
			// Delay adding the listener to prevent immediate closing
			const timer = setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
			}, 0);
			
			return () => {
				clearTimeout(timer);
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<ul class="tech-list">
	{#each visibleTech() as techName (techName)}
		<li>
			<iconify-icon icon={TECH_ICONS[techName as keyof typeof TECH_ICONS] || ''} height="16" width="16"></iconify-icon>
			<span>{techName}</span>
		</li>
	{/each}
	
	{#if hasMoreTech()}
		<li class="more-tech">
			<button type="button" onclick={toggleDropdown}>
				<iconify-icon icon="line-md:plus" height="16" width="16"></iconify-icon>
				<span>{hiddenTech().length}</span>
			</button>
			
			{#if showDropdown}
				<div class="dropdown" bind:this={dropdownRef}>
					{#each hiddenTech() as techName (techName)}
						<div class="dropdown-item">
							<iconify-icon icon={TECH_ICONS[techName as keyof typeof TECH_ICONS] || ''} height="16" width="16"></iconify-icon>
							<span>{techName}</span>
						</div>
					{/each}
				</div>
			{/if}
		</li>
	{/if}
</ul>

<style>
	.tech-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	
	li {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-family: system-ui, sans-serif;
		font-size: 0.7rem;
		color: var(--contrast);
		background: var(--body-bg);
		padding: 0.25rem;
		border-radius: 0.25rem;
	}
	
	.more-tech {
		position: relative;
	}
	
	.more-tech button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-family: system-ui, sans-serif;
		font-size: 0.7rem;
		color: var(--contrast);
		background: var(--body-bg);
		border: none;
		padding: 0;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: color 0.3s ease;
	}
	
	.more-tech button:hover {
		color: var(--accent);
	}
	
	.dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		z-index: 1000;
		background: var(--bg);
		border: 1px solid var(--outline);
		border-radius: 0.5rem;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: max-content;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		animation: dropdown-appear 0.15s ease-out;
	}
	
	@keyframes dropdown-appear {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-family: system-ui, sans-serif;
		font-size: 0.7rem;
		color: var(--contrast);
		background: var(--body-bg);
		padding: 0.25rem;
		border-radius: 0.25rem;
		white-space: nowrap;
	}
</style>