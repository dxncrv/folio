<!-- Header component with visibility control -->
<script lang="ts">
	import { talkAuth } from './talk-auth.svelte';

	interface Props {
		visible: boolean;
		isLive: boolean;
		onToggleLive: () => void;
	}

	const { visible, isLive, onToggleLive }: Props = $props();
</script>

<header class:hidden={!visible}>
	<h3>Talk</h3>
	<div class="user-info">
		<div class="live-toggle">
			<label for="live-toggle" class="toggle-label">
				<span class="toggle-text">Live</span>
				<button 
					id="live-toggle"
					class="toggle-switch" 
					class:active={isLive}
					onclick={onToggleLive}
					title={isLive ? "Disable live updates" : "Enable live updates for 5 minutes"}
					aria-label={isLive ? "Disable live updates" : "Enable live updates"}
				>
					<span class="toggle-slider"></span>
				</button>
			</label>
		</div>
		<span>{talkAuth.username}</span>
		<button onclick={() => talkAuth.logout()} title="Logout" aria-label="Logout">
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
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
		transform: translateZ(0);
		will-change: transform;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		contain: layout style;
		height: 52px;
	}

	header.hidden {
		transform: translateY(-100%);
	}

	h3 {
		font: 600 1rem/1 var(--font-ui);
		color: #fff;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		will-change: contents;
	}

	.live-toggle {
		display: flex;
		align-items: center;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;
	}

	.toggle-text {
		font: 0.8rem var(--font-read);
		color: rgba(255, 255, 255, 0.7);
	}

	.toggle-switch {
		position: relative;
		width: 40px;
		height: 22px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 11px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		padding: 0;
		display: flex;
		align-items: center;
	}

	.toggle-switch:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.toggle-switch.active {
		background: rgba(52, 199, 89, 0.25);
		border-color: rgba(52, 199, 89, 0.4);
	}

	.toggle-switch.active:hover {
		background: rgba(52, 199, 89, 0.35);
		border-color: rgba(52, 199, 89, 0.6);
	}

	.toggle-switch.active .toggle-slider {
		transform: translateX(18px);
		background: #34c759;
		box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
	}

	.toggle-slider {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s, box-shadow 0.25s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.toggle-switch:hover .toggle-slider {
		background: rgba(255, 255, 255, 0.8);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
	}

	.user-info span {
		font: 0.9rem var(--font-read);
		color: rgba(255, 255, 255, 0.9);
		user-select: none;
	}

	.user-info button {
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
		will-change: background-color, color;
	}

	.user-info button:hover {
		background: rgba(255, 69, 58, 0.2);
		color: #ff453a;
	}

	.user-info button:active {
		transform: scale(0.95) translateZ(0);
	}

	@media (max-width: 768px) {
		header {
			padding: 0.6rem 0.75rem;
			height: 48px;
		}

		h3 {
			font-size: 0.95rem;
		}

		.user-info span {
			font-size: 0.85rem;
		}
	}
</style>
