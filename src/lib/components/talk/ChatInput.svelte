<script lang="ts">
    let messageText = $state('');
    let sending = $state(false);
    let textarea: HTMLTextAreaElement | undefined = $state();

    interface Props {
        onSend: (text: string) => Promise<void>;
    }

    let { onSend }: Props = $props();

    async function handleSend() {
        if (!messageText.trim() || sending) return;

        const text = messageText.trim();
        messageText = '';
        sending = true;

        // Reset textarea height
        if (textarea) {
            textarea.style.height = 'auto';
        }

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

    function handleInput() {
        if (!textarea) return;
        
        // Auto-resize textarea
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }

    $effect(() => {
        if (textarea) {
            textarea.focus();
        }
    });
</script>

<div class="input-container">
    <div class="input-wrapper">
        <textarea
            bind:this={textarea}
            bind:value={messageText}
            onkeydown={handleKeydown}
            oninput={handleInput}
            placeholder="Message"
            disabled={sending}
            rows="1"
        ></textarea>
        <button 
            class="send-button" 
            onclick={handleSend} 
            disabled={!messageText.trim() || sending}
            class:active={messageText.trim()}
            aria-label="Send message"
            title="Send message"
        >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 10L18 10M18 10L11 3M18 10L11 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
    </div>
</div>

<style>
    .input-container {
        padding: 0.75rem 1rem 1rem 1rem;
        background: var(--bg);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .input-wrapper {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 0.5rem 0.75rem;
        transition: all 0.2s ease;
    }

    .input-wrapper:focus-within {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
    }

    textarea {
        flex: 1;
        background: transparent;
        border: none;
        color: #FFFFFF;
        font-family: var(--font-read);
        font-size: 0.95rem;
        resize: none;
        min-height: 22px;
        max-height: 120px;
        line-height: 1.4;
        padding: 0.25rem 0.5rem;
        overflow-y: auto;
    }

    textarea::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    textarea:focus {
        outline: none;
    }

    textarea:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    textarea::-webkit-scrollbar {
        width: 4px;
    }

    textarea::-webkit-scrollbar-track {
        background: transparent;
    }

    textarea::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
    }

    .send-button {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .send-button.active {
        background: linear-gradient(135deg, #0A84FF 0%, #0066CC 100%);
        color: white;
        transform: scale(1);
        box-shadow: 0 2px 8px rgba(10, 132, 255, 0.3);
    }

    .send-button.active:hover:not(:disabled) {
        background: linear-gradient(135deg, #0071F2 0%, #005BB5 100%);
        transform: scale(1.05);
        box-shadow: 0 2px 12px rgba(10, 132, 255, 0.4);
    }

    .send-button svg {
        transition: transform 0.2s ease;
        width: 22px;
        height: 22px;
    }

    .send-button.active:hover:not(:disabled) svg {
        transform: translateX(2px);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .input-container {
            padding: 0.5rem;
        }
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
    }
</style>
