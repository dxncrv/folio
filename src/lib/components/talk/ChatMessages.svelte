<script lang="ts">
    import type { TalkMessage } from '$lib/types';

    interface Props {
        messages: TalkMessage[];
        currentUser: string;
    }

    let { messages, currentUser }: Props = $props();
    let messagesEnd: HTMLDivElement | undefined = $state();

    $effect(() => {
        if (messagesEnd) {
            messagesEnd.scrollIntoView({ behavior: 'smooth' });
        }
    });

    function formatTime(timestamp: number): string {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
</script>

<div class="messages-container">
    {#if messages.length === 0}
        <div class="empty-state">
            <p>No messages yet. Start the conversation!</p>
        </div>
    {:else}
        <div class="messages-list">
            {#each messages as message (message.id)}
                <div class="message" class:own={message.username === currentUser}>
                    <div class="message-header">
                        <span class="username">{message.username}</span>
                        <span class="timestamp">{formatTime(message.timestamp)}</span>
                    </div>
                    <div class="message-text">{message.text}</div>
                </div>
            {/each}
            <div bind:this={messagesEnd}></div>
        </div>
    {/if}
</div>

<style>
    .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        background-color: var(--body-bg);
    }

    .empty-state {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .empty-state p {
        color: var(--font-dim);
        font-family: var(--font-read);
        font-size: 0.9rem;
    }

    .messages-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .message {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-width: 70%;
        align-self: flex-start;
        background: var(--bg);
        padding: 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid var(--outline);
    }

    .message.own {
        align-self: flex-end;
        background: var(--accent-dim);
        border-color: var(--accent);
    }

    .message-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.25rem;
    }

    .username {
        font-family: var(--font-ui);
        color: var(--accent);
        font-size: 0.85rem;
        font-weight: bold;
    }

    .message.own .username {
        color: var(--contrast);
    }

    .timestamp {
        font-family: var(--font-read);
        color: var(--font-dim);
        font-size: 0.75rem;
    }

    .message-text {
        font-family: var(--font-read);
        color: var(--contrast);
        font-size: 0.95rem;
        word-wrap: break-word;
        line-height: 1.4;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .message {
            max-width: 85%;
        }
    }
</style>
