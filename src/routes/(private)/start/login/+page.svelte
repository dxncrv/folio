<script lang="ts">
  import { fetchJson, ApiError } from '$lib/apiClient';

  let token = $state('');
  let msg = $state('');
  let isLoading = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    isLoading = true;
    msg = 'Logging in...';

    try {
      const body = await fetchJson('/start/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      msg = 'Login successful. You can now use admin actions.';
      handleLoginSuccess(body);
    } catch (err) {
      msg = err instanceof ApiError
        ? err.body?.error || err.message || 'Login failed'
        : 'Network error';
    } finally {
      isLoading = false;
    }
  }

  function handleLoginSuccess(body: any) {
    const serverExpires = body?.expiresAt ? Number(body.expiresAt) : null;
    const expiresAt = serverExpires || Date.now() + 5000; // 5s fallback
    const ttl = serverExpires
      ? Math.max(1, Math.floor((serverExpires - Date.now()) / 1000))
      : 5;

    try {
      localStorage.setItem('admin_token_expires', String(expiresAt));
      document.cookie = `admin_token_expires=${expiresAt}; path=/; max-age=${ttl}`;
    } catch {
      // ignore storage errors
    }

    setTimeout(() => location.reload(), 300);
  }
</script>

<main class="login">
  <form onsubmit={submit} class="form">
    <h1>Admin Login</h1>
    <input
      bind:value={token}
      type="password"
      placeholder="Enter password"
      disabled={isLoading}
      required
    />
    <button type="submit" disabled={isLoading || !token.trim()}>
      {#if isLoading}
        Loading...
      {:else}
        Login
      {/if}
    </button>
    {#if msg}
      <p class="msg" class:success={msg.includes('successful')} class:error={!msg.includes('successful')}>
        {msg}
      </p>
    {/if}
  </form>
</main>

<style>.login{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem}.form{display:flex;flex-direction:column;gap:1rem;max-width:300px;width:100%;padding:2rem;border:1px solid #ccc;border-radius:0.5rem;background:white}h1{text-align:center;margin:0}input{padding:0.5rem;border:1px solid #ccc;border-radius:0.25rem}button{padding:0.5rem;border:1px solid #ccc;border-radius:0.25rem;background:#f0f0f0;cursor:pointer}button:disabled{opacity:0.5;cursor:not-allowed}.msg{text-align:center;padding:0.5rem;border-radius:0.25rem}.msg.success{background:#d4edda;color:#155724}.msg.error{background:#f8d7da;color:#721c24}</style>
