// Context7: Factory function pattern for auth store (Svelte 5 best practice)
// Reactive authentication state management

// Context7: Export type for full TypeScript inference in consuming components
export type TalkAuthStore = ReturnType<typeof createTalkAuth>;

function createTalkAuth() {
	let authenticated = $state(false);
	let username = $state('');
	let loading = $state(false);
	let error = $state('');
	let checkingSession = $state(true);
	let sessionRestored = $state(false);

	const login = async (usernameInput: string): Promise<boolean> => {
		error = '';
		loading = true;
		try {
			const res = await fetch('/api/talk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ action: 'login', username: usernameInput.toLowerCase().trim() })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Authentication failed';
				return false;
			}
			authenticated = true;
			username = data.username;
			return true;
		} catch {
			error = 'Connection error';
			return false;
		} finally {
			loading = false;
		}
	};

	const logout = async (): Promise<void> => {
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
		reset();
	};

	const restoreSession = async (): Promise<boolean> => {
		if (sessionRestored) return authenticated;
		sessionRestored = true;

		try {
			const res = await fetch('/api/talk?action=session', {
				method: 'GET',
				credentials: 'include'
			});
			if (res.ok) {
				const data = await res.json();
				if (data.authenticated && data.username) {
					authenticated = true;
					username = data.username;
					return true;
				}
			}
		} catch (e) {
			console.error('Session restore error:', e);
		} finally {
			checkingSession = false;
		}
		return false;
	};

	const reset = (): void => {
		authenticated = false;
		username = '';
		error = '';
		sessionRestored = false;
	};

	// Context7: Expose public API via getters to preserve reactivity
	// Wrap state in functions to maintain reactive links in consuming components
	return {
		get authenticated() { return authenticated; },
		get username() { return username; },
		get loading() { return loading; },
		get error() { return error; },
		get checkingSession() { return checkingSession; },
		login,
		logout,
		restoreSession,
		reset
	} as const;
}

// Export singleton instance with inferred type
export const talkAuth = createTalkAuth();
