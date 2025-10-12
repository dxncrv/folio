<script lang="ts">
    import type { TalkSettings } from '$lib/types';

    let settings = $state<TalkSettings>({ pollingMode: 'sync' });
    let loading = $state(false);
    let message = $state('');
    let isExpanded = $state(false);

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

    function toggleExpand() {
        isExpanded = !isExpanded;
    }

    // Load settings on mount
    $effect(() => {
        loadSettings();
    });
</script>

<section class="talk-admin" class:expanded={isExpanded}>
    <header onclick={toggleExpand} onkeydown={(e) => e.key === 'Enter' && toggleExpand()} role="button" tabindex="0">
        <h2>
            <iconify-icon icon="mdi:chat" width="20" height="20"></iconify-icon>
            Talk Chat Settings
        </h2>
        <button class="toggle-btn" onclick={(e) => { e.stopPropagation(); toggleExpand(); }} aria-label="Toggle talk settings">
            <iconify-icon 
                icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
                width="20" 
                height="20"
            ></iconify-icon>
        </button>
    </header>

    {#if isExpanded}
        <div class="content">
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
                    <iconify-icon icon="mdi:delete-sweep" width="16" height="16"></iconify-icon>
                    Clear All Messages
                </button>
            </div>

            {#if message}
                <p class="message" class:success={message.includes('success')}>{message}</p>
            {/if}
        </div>
    {/if}
</section>

<style>
    .talk-admin {
        border: 2px solid var(--outline);
        border-radius: 0.5rem;
        background: var(--bg);
        overflow: hidden;
        margin-top: 2rem;
    }

    .talk-admin.expanded {
        border-color: var(--accent);
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--font-dim);
        cursor: pointer;
        user-select: none;
    }

    header:hover {
        opacity: 0.95;
    }

    h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-family: var(--font-ui);
        font-size: 1.2rem;
        color: var(--contrast);
    }

    .toggle-btn {
        background: none;
        border: none;
        color: var(--contrast);
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 0.25rem;
        transition: color 0.2s ease;
    }

    .toggle-btn:hover {
        color: var(--accent);
    }

    .content {
        padding: 1rem;
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
        font-family: var(--font-ui);
        color: var(--font-color);
        font-size: 0.9rem;
        font-weight: 600;
    }

    select {
        padding: 0.5rem;
        background: var(--bg);
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
        background: none;
        border: 2px solid var(--outline);
        border-radius: 0.25rem;
        color: #ff6b6b;
        font-family: var(--font-ui);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .danger-btn:hover:not(:disabled) {
        border-color: #ff6b6b;
        background: #ff6b6b;
        color: white;
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
        background: #ff6b6b22;
        border: 1px solid #ff6b6b;
        color: #ff6b6b;
    }

    .message.success {
        background: var(--accent);
        color: var(--body-bg);
        border-color: var(--accent);
    }
</style>
