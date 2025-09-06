<script lang="ts">
  let token = '';
  let msg = '';
  let isLoading = false;

  async function submit(e: Event) {
    e.preventDefault();
    isLoading = true;
    msg = 'Logging in...';
    try {
      const res = await fetch('/start/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const body = await res.json();
      if (res.ok) {
        msg = 'Login successful. You can now use admin actions.';
        // Use expiresAt returned by server when available (authoritative)
        const serverExpires = body?.expiresAt ? Number(body.expiresAt) : null;
        let expiresAt = serverExpires;
        let ttl = null;
        if (!serverExpires) {
          // fallback: mirror old small TTL if server didn't return expiresAt
          ttl = 5;
          expiresAt = Date.now() + ttl * 1000;
        } else {
          ttl = Math.max(1, Math.floor((serverExpires - Date.now()) / 1000));
        }

        try {
          if (expiresAt) localStorage.setItem('admin_token_expires', String(expiresAt));
          // Also write a non-HttpOnly cookie for cross-tab visibility
          if (expiresAt && ttl) document.cookie = `admin_token_expires=${expiresAt}; path=/; max-age=${ttl}`;
        } catch (e) {
          // ignore storage errors
        }

        // Reload to allow hooks and page to pick up cookie-protected state
        setTimeout(() => location.reload(), 300);
      } else {
        msg = body?.error || 'Login failed';
      }
    } catch (err) {
      msg = 'Network error';
    } finally {
      isLoading = false;
    }
  }
</script>

<main class="login-container">
  <div class="login-card">
    <div class="login-header">
      <iconify-icon icon="line-md:lock-twotone" width="48" height="48"></iconify-icon>
      <h1>Admin Access</h1>
      <p>Enter your password to access the management area</p>
    </div>

    <form on:submit|preventDefault={submit} class="login-form">
      <div class="input-group">
        <div class="input-wrapper">
          <iconify-icon icon="line-md:lock" width="20" height="20"></iconify-icon>
          <input
            id="token"
            bind:value={token}
            type="password"
            placeholder="who goes there?"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <button class="primary" type="submit" disabled={isLoading || !token.trim()}>
        {#if isLoading}
          <iconify-icon icon="line-md:loading-twotone-loop" width="20" height="20"></iconify-icon>
          Logging in...
        {:else}
          <iconify-icon icon="line-md:login" width="20" height="20"></iconify-icon>
          Login
        {/if}
      </button>
    </form>

    {#if msg}
      <div class="message" class:success={msg.includes('successful')} class:error={!msg.includes('successful')}>
        <iconify-icon
          icon={msg.includes('successful') ? 'line-md:check-all' : 'line-md:alert'}
          width="20"
          height="20"
        ></iconify-icon>
        <span>{msg}</span>
      </div>
    {/if}
  </div>
</main>

<style>
  :global(body) {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--body-bg);
    font-family: var(--font-ui);
  }

  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    width: 100%;
  }

  .login-card {
    background: var(--bg);
    border: 1px solid var(--outline);
    border-radius: 1rem;
    padding: 2.5rem;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .login-card:hover {
    border-color: var(--accent);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-header iconify-icon {
    color: var(--accent);
    margin-bottom: 1rem;
    display: block;
  }

  .login-header h1 {
    color: var(--contrast);
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    font-family: var(--font-ui);
  }

  .login-header p {
    color: var(--font-color);
    font-size: 0.95rem;
    margin: 0;
    font-family: var(--font-read);
    line-height: 1.4;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-wrapper iconify-icon {
    position: absolute;
    left: 1rem;
    color: var(--font-color);
    pointer-events: none;
    transition: color 0.3s ease;
  }

  .input-wrapper input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 3rem;
    border: 2px solid var(--outline);
    border-radius: 0.75rem;
    background: transparent;
    color: var(--contrast);
    font-family: var(--font-read);
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(140, 252, 204, 0.1);
  }

  .input-wrapper input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: none;
    border: 2px solid var(--outline);
    padding: 0.875rem 1.5rem;
    border-radius: 0.75rem;
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 1rem;
    font-weight: 500;
    color: var(--contrast);
    transition: all 0.3s ease;
    margin-top: 0.5rem;
  }

  button:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-family: var(--font-read);
    margin-top: 1rem;
    animation: slideIn 0.3s ease;
  }

  .message.success {
    background: rgba(140, 252, 204, 0.1);
    border: 1px solid rgba(140, 252, 204, 0.3);
    color: var(--accent);
  }

  .message.error {
    background: rgba(252, 165, 165, 0.1);
    border: 1px solid rgba(252, 165, 165, 0.3);
    color: #fca5a5;
  }

  .message iconify-icon {
    flex-shrink: 0;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 2rem 1.5rem;
      margin: 1rem;
    }

    .login-header h1 {
      font-size: 1.75rem;
    }

    .input-wrapper input {
      padding: 0.75rem 0.875rem 0.75rem 2.75rem;
    }

    .input-wrapper iconify-icon {
      left: 0.875rem;
    }
  }
</style>
