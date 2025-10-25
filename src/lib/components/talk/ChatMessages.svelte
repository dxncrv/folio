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
        const hours = date.getHours() % 12 || 12;
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
        return `${hours}:${minutes} ${ampm}`;
    }

    function formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }

    function shouldShowDateSeparator(index: number): boolean {
        if (index === 0) return true;
        const current = new Date(messages[index].timestamp);
        const previous = new Date(messages[index - 1].timestamp);
        return current.toDateString() !== previous.toDateString();
    }

    function shouldShowTimestamp(index: number): boolean {
        if (index === messages.length - 1) return true;
        const current = messages[index];
        const next = messages[index + 1];
        const timeDiff = next.timestamp - current.timestamp;
        return timeDiff > 60000 || next.username !== current.username;
    }

    function shouldGroupWithPrevious(index: number): boolean {
        if (index === 0) return false;
        const current = messages[index];
        const previous = messages[index - 1];
        const timeDiff = current.timestamp - previous.timestamp;
        return current.username === previous.username && timeDiff < 60000;
    }
</script>

<div class="messages-container">
    {#if messages.length === 0}
        <div class="empty-state">
            <div class="empty-icon">💬</div>
            <p>No messages yet</p>
            <span>Start the conversation!</span>
        </div>
    {:else}
        <div class="messages-list">
            {#each messages as message, index (message.id)}
                {#if shouldShowDateSeparator(index)}
                    <div class="date-separator">
                        <span>{formatDate(message.timestamp)}</span>
                    </div>
                {/if}
                
                <div 
                    class="message-wrapper" 
                    class:own={message.username === currentUser}
                    class:grouped={shouldGroupWithPrevious(index)}
                >
                    {#if !shouldGroupWithPrevious(index) && message.username !== currentUser}
                        <div class="avatar">
                            {message.username.charAt(0).toUpperCase()}
                        </div>
                    {:else if message.username !== currentUser}
                        <div class="avatar-spacer"></div>
                    {/if}
                    
                    <div class="message-content">
                        {#if !shouldGroupWithPrevious(index) && message.username !== currentUser}
                            <div class="message-header-row">
                                <span class="username">{message.username}</span>
                            </div>
                        {/if}
                        
                        <div class="message-row">
                            <div class="message-bubble" class:own={message.username === currentUser}>
                                <div class="message-text">{message.text}</div>
                            </div>
                            {#if shouldShowTimestamp(index)}
                                <span class="timestamp" class:own={message.username === currentUser}>
                                    {formatTime(message.timestamp)}
                                </span>
                            {/if}
                        </div>
                    </div>
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

    .messages-container::-webkit-scrollbar {
        width: 8px;
    }

    .messages-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .messages-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
    }

    .empty-icon {
        font-size: 4rem;
        opacity: 0.3;
        margin-bottom: 0.5rem;
    }

    .empty-state p {
        color: rgba(255, 255, 255, 0.9);
        font-family: var(--font-ui);
        font-size: 1.1rem;
        margin: 0;
        font-weight: 500;
    }

    .empty-state span {
        color: rgba(255, 255, 255, 0.5);
        font-family: var(--font-read);
        font-size: 0.9rem;
    }

    .messages-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-bottom: 0.5rem;
        width: 100%;
    }

    .date-separator {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 1rem 0;
    }

    .date-separator span {
        font-family: var(--font-read);
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.08);
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .message-wrapper {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
        align-items: flex-end;
        animation: slideIn 0.2s ease-out;
        width: 100%;
    }

    .message-wrapper.grouped {
        margin-top: 2px;
    }

    .message-wrapper.own {
        flex-direction: row-reverse;
        align-self: flex-start;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-ui);
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--body-bg);
        flex-shrink: 0;
        text-transform: uppercase;
    }

    .avatar-spacer {
        width: 28px;
        flex-shrink: 0;
    }

    .message-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        max-width: min(90%, 700px);
        word-break: break-word;
    }

    .message-wrapper.own .message-content {
        align-items: flex-end;
    }

    .message-header-row {
        padding: 0 0.5rem 0.125rem 0.5rem;
    }

    .username {
        font-family: var(--font-read);
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
    }

    .message-row {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
    }

    .message-wrapper.own .message-row {
        flex-direction: row-reverse;
    }

    .message-bubble {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 18px;
        padding: 0.65rem 0.9rem;
        word-wrap: break-word;
        overflow-wrap: break-word;
        position: relative;
        transition: all 0.2s ease;
        border: 1px solid rgba(255, 255, 255, 0.12);
        max-width: 100%;
    }

    .message-bubble:hover {
        background: rgba(255, 255, 255, 0.18);
    }

    .message-bubble.own {
        background: linear-gradient(135deg, #0A84FF 0%, #0066CC 100%);
        border: none;
        box-shadow: 0 2px 8px rgba(10, 132, 255, 0.4);
    }

    .message-bubble.own:hover {
        background: linear-gradient(135deg, #0071F2 0%, #005BB5 100%);
        box-shadow: 0 2px 12px rgba(10, 132, 255, 0.5);
    }

    .message-text {
        font-family: var(--font-read);
        color: #FFFFFF;
        font-size: 0.95rem;
        line-height: 1.4;
        white-space: pre-wrap;
    }

    .message-bubble.own .message-text {
        color: #FFFFFF;
        text-shadow: 0 0.5px 0.5px rgba(0, 0, 0, 0.1);
    }

    .timestamp {
        font-family: var(--font-read);
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
        white-space: nowrap;
        flex-shrink: 0;
        padding-bottom: 0.125rem;
        opacity: 0.1;
        transition: opacity 0.2s ease;
    }

    .message-wrapper:hover .timestamp {
        opacity: 1;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .message-content {
            max-width: 75%;
        }

        .messages-container {
            padding: 0.75rem;
        }
    }
</style>
