<script lang="ts">
    let username = $state('');
    let error = $state('');
    let loading = $state(false);

    interface Props {
        onAuthenticated: (username: string) => void;
    }

    let { onAuthenticated }: Props = $props();

    async function handleLogin() {
        error = '';
        loading = true;

        try {
            const response = await fetch('/api/talk/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.toLowerCase().trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                error = data.error || 'Authentication failed';
                loading = false;
                return;
            }

            onAuthenticated(data.username);
        } catch (err) {
            error = 'Connection error';
            console.error('Login error:', err);
        } finally {
            loading = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !loading) {
            handleLogin();
        }
    }
</script>

<div class="auth-container">
    <div class="auth-card">
        <h2>Start Talking</h2>
        <p class="subtitle">Enter your name to join</p>
        
        <input
            type="text"
            bind:value={username}
            onkeydown={handleKeydown}
            placeholder="Name"
            disabled={loading}
            autocomplete="off"
        />

        {#if error}
            <p class="error">{error}</p>
        {/if}

        <button onclick={handleLogin} disabled={loading || !username.trim()}>
            {loading ? 'Authenticating...' : 'Join Chat'}
        </button>
    </div>
</div>

<style>
    .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }

    .auth-card {
        background: var(--bg);
        border: 1px solid var(--outline);
        border-radius: 0.5rem;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
    }

    h2 {
        font-family: var(--font-ui);
        color: var(--contrast);
        margin-bottom: 0.5rem;
        font-size: 1.5rem;
    }

    .subtitle {
        font-family: var(--font-read);
        color: var(--font-color);
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        background: var(--body-bg);
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        color: var(--contrast);
        font-family: var(--font-read);
        font-size: 1rem;
        margin-bottom: 1rem;
    }

    input:focus {
        outline: none;
        border-color: var(--accent);
    }

    input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background: var(--accent);
        border: none;
        border-radius: 0.25rem;
        color: var(--body-bg);
        font-family: var(--font-ui);
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    button:hover:not(:disabled) {
        opacity: 0.8;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error {
        color: #ff6b6b;
        font-family: var(--font-read);
        font-size: 0.85rem;
        margin-bottom: 1rem;
    }
</style>
