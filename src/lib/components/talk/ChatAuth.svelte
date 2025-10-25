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
                credentials: 'include', // Include cookies for the response
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
        <div class="auth-icon">💬</div>
        <h2>Talk</h2>
        <p class="subtitle">Enter your name to start chatting</p>
        
        <div class="input-wrapper">
            <input
                type="text"
                bind:value={username}
                onkeydown={handleKeydown}
                placeholder="Your name"
                disabled={loading}
                autocomplete="off"
            />
        </div>

        {#if error}
            <div class="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>{error}</span>
            </div>
        {/if}

        <button 
            class="join-button" 
            onclick={handleLogin} 
            disabled={loading || !username.trim()}
            class:loading={loading}
        >
            {loading ? 'Joining...' : 'Continue'}
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
        padding: 1rem;
    }

    .auth-card {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        padding: 2.5rem 2rem;
        max-width: 380px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .auth-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.9;
    }

    h2 {
        font-family: var(--font-ui);
        color: #FFFFFF;
        margin-bottom: 0.5rem;
        font-size: 1.75rem;
        font-weight: 700;
        letter-spacing: -0.03em;
    }

    .subtitle {
        font-family: var(--font-read);
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 2rem;
        font-size: 0.9rem;
        text-align: center;
    }

    .input-wrapper {
        width: 100%;
        margin-bottom: 1rem;
    }

    input {
        width: 100%;
        padding: 0.9rem 1rem;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: #FFFFFF;
        font-family: var(--font-read);
        font-size: 1rem;
        transition: all 0.2s ease;
    }

    input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    input:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
    }

    input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error-message {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: rgba(255, 69, 58, 0.15);
        border: 1px solid rgba(255, 69, 58, 0.3);
        border-radius: 12px;
        color: #FF453A;
        font-size: 0.85rem;
        font-family: var(--font-read);
        margin-bottom: 1rem;
    }

    .error-message svg {
        flex-shrink: 0;
    }

    .join-button {
        width: 100%;
        padding: 0.9rem 1rem;
        background: linear-gradient(135deg, #0A84FF 0%, #0066CC 100%);
        border: none;
        border-radius: 12px;
        color: #FFFFFF;
        font-family: var(--font-ui);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(10, 132, 255, 0.4);
        margin-bottom: 1rem;
        text-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.1);
    }

    .join-button:hover:not(:disabled) {
        background: linear-gradient(135deg, #0071F2 0%, #005BB5 100%);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(10, 132, 255, 0.5);
    }

    .join-button:active:not(:disabled) {
        transform: translateY(0);
    }

    .join-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    .join-button.loading {
        opacity: 0.7;
    }

</style>
