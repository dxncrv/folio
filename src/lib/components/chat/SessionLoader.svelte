<!-- Session loader component -->
<div class="session-loader">
	<div class="spinner">
		<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
			<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.2" />
			<path
				d="M12 3c4.97 0 9 4.03 9 9"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-dasharray="20"
				stroke-dashoffset="0"
			/>
		</svg>
	</div>
	<p>Checking session...</p>
</div>

<style>
	.session-loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		width: 100%;
		height: 100%;
		min-height: 200px;
	}

	.spinner {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
	}

	.spinner svg {
		animation: spin 1.5s linear infinite;
		color: rgba(255, 255, 255, 0.6);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.session-loader p {
		font: 0.9rem var(--font-read);
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		letter-spacing: 0.02em;
	}
</style>
