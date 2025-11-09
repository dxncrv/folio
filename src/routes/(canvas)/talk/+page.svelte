<script lang="ts">
    import Chat from '$lib/components/chat.svelte';
</script>

<div class="page-container">
    <div class="chat-frame">
        <Chat />
    </div>
</div>

<style>
    .page-container {
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: center;
    }

    .chat-frame {
        display: flex;
        width: 100%;
        height: 100%;
    }

    @media (min-width: 769px) {
        .chat-frame {
            width: 540px;
            height: calc(100% - 3rem);
            margin: 1.5rem 2rem 1.5rem 0;
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 28px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            overflow: hidden;
        }
    }
</style>
