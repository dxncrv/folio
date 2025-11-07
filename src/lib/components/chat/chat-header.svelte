<!-- Header component with visibility control -->
<script lang="ts">
	import { talkAuth } from './talk-auth.svelte';

	interface Props {
		visible: boolean;
	}

	const { visible }: Props = $props();
</script>

<header class:hidden={!visible}>
	<h3>Talk</h3>
	<div class="user-info">
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
