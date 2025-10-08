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
            <div class="header-content">
                <h3>Talk</h3>
                <div class="header-right">
                    <div class="header-info">
                        <span class="current-user">{currentUser}</span>
                        {#if settings.pollingMode === 'sync'}
                            <div class="status-indicator">
                                <span class="status-dot"></span>
                                <span class="status-text">Live</span>
                            </div>
                        {/if}
                    </div>
                    {#if settings.pollingMode === 'async'}
                        <button class="refresh-btn" onclick={handleRefresh} title="Refresh messages" aria-label="Refresh messages">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12C21 16.97 16.97 21 12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M3 12L7 8M3 12L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    {/if}
                </div>
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
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(20px);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .header-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-align: right;
    }

    h3 {
        font-family: var(--font-ui);
        color: #FFFFFF;
        font-size: 1rem;
        margin: 0;
        font-weight: 600;
        letter-spacing: -0.02em;
    }

    .current-user {
        font-family: var(--font-read);
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.875rem;
    }

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }

    .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #34C759;
        animation: pulse 2s ease-in-out infinite;
    }

    .status-text {
        font-family: var(--font-read);
        color: #34C759;
        font-size: 0.7rem;
        font-weight: 500;
    }

    @keyframes pulse {
        0%, 100% { 
            opacity: 1;
            transform: scale(1);
        }
        50% { 
            opacity: 0.6;
            transform: scale(0.9);
        }
    }

    .refresh-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        border: none;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .refresh-btn:hover {
        background: rgba(255, 255, 255, 0.18);
        color: #FFFFFF;
        transform: rotate(-45deg);
    }

    .refresh-btn:active {
        transform: rotate(-180deg);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .chat-header {
            padding: 0.5rem 0.75rem;
        }

        h3 {
            font-size: 0.95rem;
        }

        .current-user {
            font-size: 0.8rem;
        }

        .status-text {
            font-size: 0.65rem;
        }

        .header-right {
            gap: 0.5rem;
        }
    }
</style>
