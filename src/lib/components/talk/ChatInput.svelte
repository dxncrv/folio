<script lang="ts">
    let messageText = $state('');
    let sending = $state(false);

    interface Props {
        onSend: (text: string) => Promise<void>;
    }

    let { onSend }: Props = $props();

    async function handleSend() {
        if (!messageText.trim() || sending) return;

        const text = messageText.trim();
        messageText = '';
        sending = true;

        try {
            await onSend(text);
        } catch (error) {
            console.error('Error sending message:', error);
            messageText = text; // Restore message on error
        } finally {
            sending = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }
</script>

<div class="input-container">
    <textarea
        bind:value={messageText}
        onkeydown={handleKeydown}
        placeholder="Type a message..."
        disabled={sending}
        rows="1"
    ></textarea>
    <button onclick={handleSend} disabled={!messageText.trim() || sending}>
        {sending ? '...' : '→'}
    </button>
</div>

<style>
    .input-container {
        display: flex;
        gap: 0.5rem;
        padding: 1rem;
        border-top: 1px solid var(--outline);
        background: var(--body-bg);
    }

    textarea {
        flex: 1;
        padding: 0.75rem;
        background: var(--bg);
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        color: var(--contrast);
        font-family: var(--font-read);
        font-size: 0.95rem;
        resize: none;
        min-height: 2.5rem;
        max-height: 8rem;
    }

    textarea:focus {
        outline: none;
        border-color: var(--accent);
    }

    textarea:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    button {
        padding: 0 1.5rem;
        background: var(--accent);
        border: none;
        border-radius: 0.25rem;
        color: var(--body-bg);
        font-size: 1.5rem;
        font-weight: bold;
        cursor: pointer;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    button:hover:not(:disabled) {
        opacity: 0.8;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .input-container {
            padding: 0.75rem;
        }

        button {
            padding: 0 1rem;
        }
    }
</style>
