<script lang="ts">
  import { fetchJson, ApiError } from '$lib/apiClient';

  let token = $state('');
  let msg = $state('');
  let isLoading = $state(false);
  let timer: ReturnType<typeof setTimeout>;
  let input: HTMLInputElement;

  async function login() {
    if (!token.trim() || isLoading) return;
    
    isLoading = true;

    try {
      const body = await fetchJson('/start/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      // Set session and reload
      const expires = body?.expiresAt ? Number(body.expiresAt) : Date.now() + 5000;
      const ttl = Math.max(1, Math.floor((expires - Date.now()) / 1000));
      
      try {
        localStorage.setItem('admin_token_expires', String(expires));
        document.cookie = `admin_token_expires=${expires}; path=/; max-age=${ttl}`;
      } catch {}

      location.reload();
    } catch (err) {
      msg = err instanceof ApiError ? err.body?.error || 'Invalid password' : 'Network error';
      if (msg.toLowerCase().includes('forbidden')) {
        token = '';
        setTimeout(() => input?.focus(), 50);
      }
    } finally {
      isLoading = false;
    }
  }

  function onInput() {
    msg = ''; // Clear errors when typing
    clearTimeout(timer);
    if (token.trim()) {
      timer = setTimeout(login, 800);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      clearTimeout(timer);
      login();
    }
  }
</script>

<main>
  <div class="form">
    <h1>Login</h1>
    <input
      bind:this={input}
      bind:value={token}
      oninput={onInput}
      onkeydown={onKeyDown}
      type="password"
      disabled={isLoading}
    />
    {#if isLoading}
      <p class="loading">Logging in...</p>
    {:else if msg}
      <p class="error">{msg}</p>
    {/if}
  </div>
</main>

<style>
main { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
.form { display: flex; flex-direction: column; gap: 1rem; max-width: 300px; width: 100%; padding: 2rem; border: 1px solid var(--outline); border-radius: 0.5rem; background: var(--bg); }
h1 { text-align: center; margin: 0; font-size: 1.5rem; font-family: var(--font-ui); color: var(--accent); }
input { padding: 0.75rem; background: var(--body-bg); border-radius: 1rem; font-size: 1rem; color: var(--accent)}
input:focus { border: 2px solid var(--accent); outline: none; }
input:disabled { opacity: 0.5; }
p { text-align: center; padding: 0.5rem; border-radius: 0.25rem; margin: 0; font-size: 0.9rem; }
.loading { background: #d1ecf1; color: #0c5460; }
.error { background: #f8d7da; color: #721c24; }
</style>
