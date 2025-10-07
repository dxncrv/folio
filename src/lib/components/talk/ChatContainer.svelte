<script lang="ts">
    import type { TalkMessage, TalkSettings } from '$lib/types';
    import ChatAuth from './ChatAuth.svelte';
    import ChatMessages from './ChatMessages.svelte';
    import ChatInput from './ChatInput.svelte';

    let authenticated = $state(false);
    let currentUser = $state('');
    let messages = $state<TalkMessage[]>([]);
    let settings = $state<TalkSettings>({ pollingMode: 'sync' });
    let pollingInterval: NodeJS.Timeout | null = null;

    // Fetch initial settings and messages
    async function initialize() {
        try {
            // Fetch settings
            const settingsRes = await fetch('/api/talk/settings');
            if (settingsRes.ok) {
                settings = await settingsRes.json();
            }

            // Fetch messages
            await fetchMessages();

            // Start polling if sync mode
            if (settings.pollingMode === 'sync') {
                startPolling();
            }
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async function fetchMessages() {
        try {
            const response = await fetch('/api/talk/messages');
            if (response.ok) {
                messages = await response.json();
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    async function sendMessage(text: string) {
        try {
            const response = await fetch('/api/talk/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Immediately fetch messages after sending
            await fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    function startPolling() {
        if (pollingInterval) return;
        pollingInterval = setInterval(fetchMessages, 3000);
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }

    function handleAuthenticated(username: string) {
        authenticated = true;
        currentUser = username;
        initialize();
    }

    async function handleRefresh() {
        await fetchMessages();
    }

    // Cleanup on component destroy
    $effect(() => {
        return () => {
            stopPolling();
        };
    });

    // Watch settings changes
    $effect(() => {
        if (authenticated) {
            if (settings.pollingMode === 'sync') {
                startPolling();
            } else {
                stopPolling();
            }
        }
    });
</script>

<div class="chat-container">
    {#if !authenticated}
        <ChatAuth onAuthenticated={handleAuthenticated} />
    {:else}
        <div class="chat-header">
            <div class="header-left">
                <h3>Talk</h3>
                <span class="user-badge">{currentUser}</span>
            </div>
            <div class="header-right">
                {#if settings.pollingMode === 'async'}
                    <button class="refresh-btn" onclick={handleRefresh} title="Refresh messages">
                        ↻
                    </button>
                {/if}
                <span class="mode-indicator" class:sync={settings.pollingMode === 'sync'}>
                    {settings.pollingMode === 'sync' ? '●' : '○'}
                </span>
            </div>
        </div>
        <ChatMessages {messages} {currentUser} />
        <ChatInput onSend={sendMessage} />
    {/if}
</div>

<style>
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
    }

    .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--outline);
        background: var(--bg);
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    h3 {
        font-family: var(--font-ui);
        color: var(--contrast);
        font-size: 1.25rem;
        margin: 0;
    }

    .user-badge {
        font-family: var(--font-read);
        color: var(--accent);
        font-size: 0.85rem;
        padding: 0.25rem 0.75rem;
        background: var(--body-bg);
        border: 1px solid var(--accent);
        border-radius: 1rem;
    }

    .mode-indicator {
        font-size: 1rem;
        color: var(--font-dim);
        transition: color 0.3s;
    }

    .mode-indicator.sync {
        color: var(--accent);
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    .refresh-btn {
        padding: 0.25rem 0.75rem;
        background: var(--bg);
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        color: var(--contrast);
        font-size: 1.25rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .refresh-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .chat-header {
            padding: 0.75rem;
        }

        h3 {
            font-size: 1rem;
        }

        .user-badge {
            font-size: 0.75rem;
            padding: 0.2rem 0.5rem;
        }
    }
</style>
