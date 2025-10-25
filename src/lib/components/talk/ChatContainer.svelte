<script lang="ts">
    import type { TalkMessage } from '$lib/types';
    import ChatAuth from './ChatAuth.svelte';
    import ChatMessages from './ChatMessages.svelte';
    import ChatInput from './ChatInput.svelte';

    let authenticated = $state(false);
    let currentUser = $state('');
    let messages = $state<TalkMessage[]>([]);
    let checkingSession = $state(true);

    // Check for existing session on mount
    async function checkSession() {
        try {
            const response = await fetch('/api/talk/session', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                // User has valid session
                authenticated = true;
                currentUser = data.username;
                await initialize();
            }
        } catch (error) {
            console.error('Session check error:', error);
        } finally {
            checkingSession = false;
        }
    }

    // Fetch initial messages
    async function initialize() {
        try {
            // Fetch messages
            await fetchMessages();
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
                credentials: 'include', // Include cookies
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to send message');
            }

            // Immediately fetch messages after sending
            await fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    function handleAuthenticated(username: string) {
        authenticated = true;
        currentUser = username;
        initialize();
    }

    async function handleLogout() {
        authenticated = false;
        currentUser = '';
        messages = [];
    }

    // Check session on component mount
    $effect(() => {
        checkSession();
    });

</script>

<div class="chat-container">
    {#if checkingSession}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Checking session...</p>
        </div>
    {:else if !authenticated}
        <ChatAuth onAuthenticated={handleAuthenticated} />
    {:else}
        <div class="chat-header">
            <div class="header-content">
                <h3>Talk</h3>
                <div class="header-right">
                    <span class="current-user">{currentUser}</span>
                    <button 
                        class="logout-btn" 
                        onclick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
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
        max-width: 900px;
        margin: 0 auto;
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
        gap: 0.5rem;
    }

    .current-user {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.9);
    }

    .logout-btn {
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .logout-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.95);
    }

    .logout-btn:active {
        transform: scale(0.95);
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
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 1rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .loading-container p {
        font-size: 0.9rem;
        margin: 0;
    }
</style>
