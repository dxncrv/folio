<script lang="ts">
	import { serverStatus } from '$lib/dxn-svr/status.svelte.ts';

	const CHECK_INTERVAL = 30000; // 30 seconds

	$effect(() => {
		// Run initial check
		serverStatus.check();

		// Set up interval to check server status every 30 seconds
		const interval = setInterval(() => {
			serverStatus.check();
		}, CHECK_INTERVAL);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="status-indicator">
	<span class="svr {serverStatus.status}" aria-label={serverStatus.status}></span>
	<div class="status-text">
		<span class="status-label">dxn-svr: <span class="status-value">{serverStatus.status}</span></span>
	</div>
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
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
		transition: all 0.3s ease;
	}

	.svr.online {
		background-color: var(--accent);
		box-shadow: 0 0 10px var(--accent);
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.svr.offline {
		background-color: #ef4444;
		box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
	}

	.svr.checking {
		background-color: #eab308;
		animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	.status-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.status-label {
		font-size: 0.9rem;
		color: var(--contrast);
		opacity: 0.8;
	}

	.status-value {
		text-transform: capitalize;
		font-weight: 500;
		color: var(--accent);
		opacity: 1;
	}

	.timestamp {
		font-size: 0.75rem;
		color: var(--contrast);
		opacity: 0.6;
	}

	.error-msg {
		font-size: 0.75rem;
		color: #ef4444;
		font-style: italic;
		opacity: 0.8;
	}
</style>