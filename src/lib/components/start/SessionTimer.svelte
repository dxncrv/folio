<script lang="ts">
// sessionExpiresAt is read from localStorage or cookie
let sessionExpiresAt = $state<number | null>(null);
// currentTime is advanced every second to drive reactivity
let currentTime = $state<number>(Date.now());

// derived display string (MM:SS) or 'Expired'
let remaining = $derived(() => {
	if (!sessionExpiresAt) return '00:00';
	const diff = sessionExpiresAt - currentTime;
	if (diff <= 0) return 'Expired';
	const totalSec = Math.floor(diff / 1000);
	const mins = Math.floor(totalSec / 60);
	const secs = totalSec % 60;
	return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
});

let isExpired = $derived(() => !!sessionExpiresAt && (sessionExpiresAt - currentTime <= 0));

function readExpiryFromStorage(): number | null {
	try {
		const v = localStorage.getItem('admin_token_expires');
		if (v) {
			const n = Number(v);
			if (!Number.isNaN(n)) return n;
		}
	} catch (e) {
		// ignore
	}
	const match = document.cookie.match(/(?:^|; )admin_token_expires=(\d+)/);
	if (match) {
		const n = Number(match[1]);
		if (!Number.isNaN(n)) return n;
	}
	return null;
}

let timerHandle: number | null = null;

function startTimer() {
	stopTimer();
	sessionExpiresAt = readExpiryFromStorage();
	if (!sessionExpiresAt) return;

	// ensure immediate update
	currentTime = Date.now();

	timerHandle = setInterval(() => {
		currentTime = Date.now();
		if (!sessionExpiresAt) return;
		if (sessionExpiresAt - currentTime <= 0) {
			// expired: remove stored expiry and stop
			try { localStorage.removeItem('admin_token_expires'); } catch (e) {}
			document.cookie = 'admin_token_expires=; path=/; max-age=0';
			stopTimer();
		}
	}, 1000) as unknown as number;
}

function stopTimer() {
	if (timerHandle) {
		clearInterval(timerHandle as unknown as number);
		timerHandle = null;
	}
}

$effect(() => {
	startTimer();
	// keep in sync if another tab updates the expiry
	const onStorage = (e: StorageEvent) => {
		if (e.key === 'admin_token_expires') {
			const v = readExpiryFromStorage();
			sessionExpiresAt = v;
			if (v && !timerHandle) startTimer();
			if (!v) stopTimer();
		}
	};
	window.addEventListener('storage', onStorage);
	return () => window.removeEventListener('storage', onStorage);
});
</script>

<span class="session-timer" aria-live="polite" class:expired={isExpired()}>{remaining()}</span>

<style>
	.session-timer {
		font-family: var(--font-ui);
		margin-left: 0.75rem;
		font-size: 0.9rem;
		color: var(--font-color);
		background: rgba(255,255,255,0.03);
		padding: 0.15rem 0.5rem;
		border-radius: 0.35rem;
		border: 1px solid rgba(255,255,255,0.03);
	}

	.session-timer.expired {
		color: #ff6b6b;
		border-color: rgba(255,107,107,0.12);
		background: rgba(255,107,107,0.03);
		font-weight: 600;
	}
</style>
