<script lang="ts">
    import type { TalkSettings } from '$lib/types';

    let settings = $state<TalkSettings>({ pollingMode: 'sync' });
    let loading = $state(false);
    let message = $state('');

    async function loadSettings() {
        try {
            const response = await fetch('/api/talk/settings');
            if (response.ok) {
                settings = await response.json();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async function updatePollingMode() {
        loading = true;
        message = '';

        try {
            const response = await fetch('/api/talk/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                message = 'Settings updated successfully';
            } else {
                message = 'Failed to update settings';
            }
        } catch (error) {
            message = 'Error updating settings';
            console.error('Error updating settings:', error);
        } finally {
            loading = false;
        }
    }

    async function clearMessages() {
        if (!confirm('Are you sure you want to clear all chat messages?')) {
            return;
        }

        loading = true;
        message = '';

        try {
            const response = await fetch('/api/talk/admin', {
                method: 'DELETE'
            });

            if (response.ok) {
                message = 'Messages cleared successfully';
            } else {
                message = 'Failed to clear messages';
            }
        } catch (error) {
            message = 'Error clearing messages';
            console.error('Error clearing messages:', error);
        } finally {
            loading = false;
        }
    }

    // Load settings on mount
    $effect(() => {
        loadSettings();
    });
</script>

<div class="talk-admin">
    <h3>Talk Chat Settings</h3>

    <div class="setting-group">
        <label>
            <span class="label-text">Polling Mode</span>
            <select bind:value={settings.pollingMode} onchange={updatePollingMode} disabled={loading}>
                <option value="sync">Synchronous (auto-refresh every 3s)</option>
                <option value="async">Asynchronous (manual refresh)</option>
            </select>
        </label>
    </div>

    <div class="danger-zone">
        <h4>Danger Zone</h4>
        <button class="danger-btn" onclick={clearMessages} disabled={loading}>
            Clear All Messages
        </button>
    </div>

    {#if message}
        <p class="message" class:success={message.includes('success')}>{message}</p>
    {/if}
</div>

<style>
    .talk-admin {
        background: var(--bg);
        border: 1px solid var(--outline);
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }

    h3 {
        font-family: var(--font-ui);
        color: var(--contrast);
        font-size: 1.25rem;
        margin-bottom: 1rem;
    }

    h4 {
        font-family: var(--font-ui);
        color: var(--contrast);
        font-size: 1rem;
        margin-bottom: 0.75rem;
    }

    .setting-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .label-text {
        font-family: var(--font-read);
        color: var(--font-color);
        font-size: 0.9rem;
    }

    select {
        padding: 0.5rem;
        background: var(--body-bg);
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        color: var(--contrast);
        font-family: var(--font-read);
        font-size: 0.9rem;
        cursor: pointer;
    }

    select:focus {
        outline: none;
        border-color: var(--accent);
    }

    select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .danger-zone {
        padding-top: 1.5rem;
        border-top: 1px solid var(--outline);
    }

    .danger-btn {
        padding: 0.5rem 1rem;
        background: #ff6b6b;
        border: none;
        border-radius: 0.25rem;
        color: white;
        font-family: var(--font-ui);
        font-size: 0.9rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .danger-btn:hover:not(:disabled) {
        opacity: 0.8;
    }

    .danger-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .message {
        margin-top: 1rem;
        padding: 0.75rem;
        border-radius: 0.25rem;
        font-family: var(--font-read);
        font-size: 0.85rem;
        background: #ff6b6b;
        color: white;
    }

    .message.success {
        background: var(--accent);
        color: var(--body-bg);
    }
</style>
