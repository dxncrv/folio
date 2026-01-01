<script lang="ts">
	import { talkAuth } from './talk-auth.svelte';

	interface Props {
		visible?: boolean;
		isLive?: boolean;
		ontoggleLive?: () => void;
	}
	let { visible = true, isLive = $bindable(true), ontoggleLive }: Props = $props();
</script>

<header class:hidden={!visible}>
	<h3>Talk</h3>
	<div class="user-info">
		<label class="live-toggle">
			<span class="toggle-text">Live</span>
			<button 
				class="toggle-switch" 
				class:active={isLive}
				onclick={() => { isLive = !isLive; ontoggleLive?.(); }}
				title={isLive ? 'Disable live updates' : 'Enable live updates'}
				aria-label={isLive ? 'Disable live updates' : 'Enable live updates'}
			>
				<span class="toggle-slider"></span>
			</button>
		</label>
		<span class="username">{talkAuth.username}</span>
		<button class="logout-btn" onclick={() => talkAuth.logout()} title="Logout" aria-label="Logout">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
			</svg>
		</button>
	</div>
</header>

<style>
	header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(20px);
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 52px;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform;
	}

	header.hidden { transform: translateY(-100%); }

	header h3 {
		font: 600 1rem/1 var(--font-ui);
		color: #fff;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.live-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
		padding: 0.35rem 0.5rem;
	}

	.toggle-text {
		font: 500 0.75rem var(--font-read);
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.toggle-switch {
		position: relative;
		width: 36px;
		height: 20px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		border: none;
		cursor: pointer;
		transition: all 0.25s;
		padding: 0;
		display: flex;
		align-items: center;
	}

	.toggle-switch:hover { background: rgba(255, 255, 255, 0.15); }
	.toggle-switch.active { background: rgba(52, 199, 89, 0.2); }
	.toggle-switch.active:hover { background: rgba(52, 199, 89, 0.3); }

	.toggle-slider {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		transition: transform 0.25s, background 0.25s, box-shadow 0.25s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-switch:hover .toggle-slider { background: rgba(255, 255, 255, 0.8); }
	.toggle-switch.active .toggle-slider {
		transform: translateX(16px);
		background: #34c759;
		box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
	}

	.username {
		font: 0.9rem var(--font-ui);
		color: rgba(255, 255, 255, 0.9);
		user-select: none;
	}

	.logout-btn {
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: rgba(255, 69, 58, 0.2);
		color: #ff453a;
	}

	.logout-btn:active { transform: scale(0.95); }
</style>
