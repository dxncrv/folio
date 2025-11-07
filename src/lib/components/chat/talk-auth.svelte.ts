// Shared reactive state pattern
// Creates a singleton auth store following Svelte 5 runes best practices

class TalkAuth {
	authenticated = $state(false);
	username = $state('');
	loading = $state(false);
	error = $state('');
	checkingSession = $state(true);
	sessionRestored = $state(false);

	// Derived computed values ($derived over $effect for simple derivations)
	get isAuthenticated() {
		return this.authenticated;
	}

	async login(usernameInput: string) {
		this.error = '';
		this.loading = true;
		try {
			const res = await fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'login', username: usernameInput.toLowerCase().trim() })
			});
			const data = await res.json();
			if (!res.ok) {
				this.error = data.error || 'Authentication failed';
				return false;
			}
			this.authenticated = true;
			this.username = data.username;
			return true;
		} catch {
			this.error = 'Connection error';
			return false;
		} finally {
			this.loading = false;
		}
	}

	async logout() {
		try {
			await fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'logout' })
			});
		} catch (e) {
			console.error('Logout request error:', e);
		}
		this.reset();
	}

	async restoreSession() {
		if (this.sessionRestored) return;
		this.sessionRestored = true;

		try {
			const res = await fetch('/api/talk?action=session', {
				method: 'GET',
				credentials: 'include'
			});
			if (res.ok) {
				const data = await res.json();
				if (data.authenticated && data.username) {
					this.authenticated = true;
					this.username = data.username;
					return true;
				}
			}
		} catch (e) {
			console.error('Session restore error:', e);
		} finally {
			this.checkingSession = false;
		}
		return false;
	}

	reset() {
		this.authenticated = false;
		this.username = '';
		this.error = '';
		this.sessionRestored = false;
	}
}

// Export singleton instance
export const talkAuth = new TalkAuth();
