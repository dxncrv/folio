<script lang="ts">
	import { serverStatus } from '$lib/_svr/status.svelte';

	$effect(() => {
		serverStatus.connect();
		return () => serverStatus.disconnect();
	});
</script>

<div class="status-indicator">
	<iconify-icon class="svr {serverStatus.status}" aria-label={serverStatus.status} icon="line-md:monitor-twotone" style="--icon-size:12px"></iconify-icon>
	<span class="status-label">svr: <b>{serverStatus.status}</b></span>
</div>

<style>
	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-family: var(--font-ui);
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--bg);
	}

	.svr {
		width: 12px;
		height: 12px;
		flex-shrink: 0;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: var(--icon-size, 12px);
		color: var(--svr-color, var(--accent));
	}

	.svr.online { color: var(--accent); filter: drop-shadow(0 0 10px var(--accent)); }
	.svr.offline { color: #ef4444; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.4)); }
	.svr.connecting { color: #eab308; animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.status-label {
		font-size: 0.9rem;
		color: var(--contrast);
		opacity: 0.8;
	}

	b {
		text-transform: capitalize;
		font-weight: 500;
		color: var(--accent);
		opacity: 1;
	}
</style>