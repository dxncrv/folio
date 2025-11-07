<script lang="ts">
import { fetchJson } from '$lib/apiClient';
import type { RedisKeyInfo, RedisStats } from '$lib/types';

interface KeyWithValue extends RedisKeyInfo {
    value?: string;
    expanded?: boolean;
}

// Reactive state using Svelte 5 $state rune
let stats = $state<RedisStats | null>(null);
let keys = $state<KeyWithValue[]>([]);
let loading = $state(false);
let error = $state('');
let pattern = $state('*');
let limit = $state(100);
let selectedKey = $state<string | null>(null);
let isExpanded = $state(true);
let deleteQueue = $state<Set<string>>(new Set());
let showJsonFormatted = $state(false);
let cachedData = $state<{ stats: RedisStats | null; keys: KeyWithValue[]; timestamp: number } | null>(null);

// Derived state for filtered display
let filteredKeys = $derived(
    keys.filter(k => k.key.toLowerCase().includes(pattern.toLowerCase()))
);

// Load stats on component mount with caching
$effect(() => {
    // Use cached data if available and less than 30 seconds old
    if (cachedData && Date.now() - cachedData.timestamp < 30000) {
        stats = cachedData.stats;
        keys = cachedData.keys;
    } else {
        loadStats();
    }
});

async function loadStats() {
    loading = true;
    error = '';
    try {
        const data = await fetchJson('/api/redis?action=stats', { requiresAuth: true }) as RedisStats;
        stats = data;
        cachedData = { stats: data, keys: [], timestamp: Date.now() };
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to load stats';
    } finally {
        loading = false;
    }
}

async function scanKeys() {
    loading = true;
    error = '';
    try {
        const data = await fetchJson(
            `/api/redis?action=allKeys&pattern=${encodeURIComponent(pattern)}&limit=${limit}`,
            { requiresAuth: true }
        ) as { keys: RedisKeyInfo[]; count: number };
        keys = data.keys.map((k: RedisKeyInfo) => ({ ...k, expanded: false }));
        // Update cache
        cachedData = { stats, keys, timestamp: Date.now() };
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to scan keys';
    } finally {
        loading = false;
    }
}

async function toggleKeyValue(key: KeyWithValue) {
    if (key.expanded) {
        // Collapse
        key.expanded = false;
        key.value = undefined;
        keys = [...keys];
        return;
    }

    // Expand and load value
    try {
        const data = await fetchJson(
            `/api/redis?action=getValue&key=${encodeURIComponent(key.key)}`,
            { requiresAuth: true }
        ) as { key: string; value: string | null };
        key.value = data.value || 'null';
        key.expanded = true;
        keys = [...keys];
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to load value';
    }
}

function formatValue(value: string): string {
    if (!showJsonFormatted) return value;
    
    try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return value;
    }
}

function toggleDeleteQueue(keyName: string) {
    if (deleteQueue.has(keyName)) {
        deleteQueue.delete(keyName);
    } else {
        deleteQueue.add(keyName);
    }
    deleteQueue = new Set(deleteQueue); // Trigger reactivity
}

function clearDeleteQueue() {
    deleteQueue.clear();
    deleteQueue = new Set(deleteQueue);
}

async function executeDeleteQueue() {
    if (deleteQueue.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${deleteQueue.size} key(s)?\n\nThis cannot be undone!`)) return;

    loading = true;
    error = '';
    const keysToDelete = Array.from(deleteQueue);
    
    try {
        // Delete all keys in queue
        await Promise.all(
            keysToDelete.map(keyName =>
                fetchJson(`/api/redis?key=${encodeURIComponent(keyName)}`, {
                    method: 'DELETE',
                    requiresAuth: true
                })
            )
        );
        
        keys = keys.filter(k => !deleteQueue.has(k.key));
        deleteQueue.clear();
        deleteQueue = new Set(deleteQueue);
        error = `Successfully deleted ${keysToDelete.length} key(s)`;
        await loadStats();
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to delete keys';
    } finally {
        loading = false;
    }
}

async function deleteKey(keyName: string) {
    if (!confirm(`Are you sure you want to delete key: ${keyName}?`)) return;

    try {
        await fetchJson(`/api/redis?key=${encodeURIComponent(keyName)}`, {
            method: 'DELETE',
            requiresAuth: true
        });
        keys = keys.filter(k => k.key !== keyName);
        await loadStats();
    } catch (err) {
        error = err instanceof Error ? err.message : 'Failed to delete key';
    }
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function formatTTL(ttl: number): string {
    if (ttl === -1) return 'No expiry';
    if (ttl === -2) return 'Expired';
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m`;
    if (ttl < 86400) return `${Math.floor(ttl / 3600)}h`;
    return `${Math.floor(ttl / 86400)}d`;
}

function toggleExpand() {
    isExpanded = !isExpanded;
}
</script>

<section class="redis-inspector" class:expanded={isExpanded}>
    <header onclick={toggleExpand} onkeydown={(e) => e.key === 'Enter' && toggleExpand()} role="button" tabindex="0">
        <h2>
            <iconify-icon icon="simple-icons:redis" width="20" height="20"></iconify-icon>
            Inspector
        </h2>
        <button class="toggle-btn" onclick={(e) => { e.stopPropagation(); toggleExpand(); }} aria-label="Toggle Redis Inspector">
            <iconify-icon 
                icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
                width="20" 
                height="20"
            ></iconify-icon>
        </button>
    </header>

    {#if isExpanded}
        <div class="content">
            {#if error}
                <div class="message error">{error}</div>
            {/if}

            {#if loading}
                <div class="loading">
                    <iconify-icon icon="line-md:loading-loop" width="24" height="24"></iconify-icon>
                    Loading...
                </div>
            {/if}

            <!-- Stats Panel -->
            {#if stats}
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-label">Total Keys</span>
                        <span class="stat-value">{stats.totalKeys}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Memory Used</span>
                        <span class="stat-value">{stats.memoryUsed}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Connected Clients</span>
                        <span class="stat-value">{stats.connectedClients}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Uptime</span>
                        <span class="stat-value">{formatUptime(stats.uptime)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Version</span>
                        <span class="stat-value">{stats.version}</span>
                    </div>
                </div>
            {/if}

            <!-- Key Scanner -->
            <div class="scanner">
                <h3>Key Scanner</h3>
                <div class="scanner-controls">
                    <input 
                        type="text" 
                        bind:value={pattern} 
                        placeholder="Pattern (e.g., user:* or *)"
                        class="pattern-input"
                    />
                    <input 
                        type="number" 
                        bind:value={limit} 
                        min="1" 
                        max="1000" 
                        placeholder="Limit"
                        class="limit-input"
                    />
                    <button onclick={scanKeys} class="scan-btn" disabled={loading}>
                        <iconify-icon icon="material-symbols:search" width="18" height="18"></iconify-icon>
                        Scan
                    </button>
                </div>
                <div class="scanner-options">
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={showJsonFormatted} />
                        <span>Format JSON values</span>
                    </label>
                </div>
            </div>

            <!-- Keys List -->
            {#if keys.length > 0}
                <div class="keys-list">
                    <div class="keys-header">
                        <span class="checkbox-col">
                            <iconify-icon icon="mdi:checkbox-blank-outline" width="16" height="16"></iconify-icon>
                        </span>
                        <span>Key ({filteredKeys.length})</span>
                        <span>Type</span>
                        <span>TTL</span>
                        <span>Size</span>
                        <span>Actions</span>
                    </div>
                    {#each filteredKeys as key}
                        <div class="key-item" class:queued={deleteQueue.has(key.key)}>
                            <div class="key-row">
                                <input 
                                    type="checkbox" 
                                    checked={deleteQueue.has(key.key)}
                                    onchange={() => toggleDeleteQueue(key.key)}
                                    class="key-checkbox"
                                    aria-label="Add to delete queue"
                                />
                                <button 
                                    class="key-name" 
                                    onclick={() => toggleKeyValue(key)}
                                    title="Click to view value"
                                >
                                    <iconify-icon 
                                        icon={key.expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} 
                                        width="16" 
                                        height="16"
                                    ></iconify-icon>
                                    {key.key}
                                </button>
                                <span class="key-type">{key.type}</span>
                                <span class="key-ttl">{formatTTL(key.ttl)}</span>
                                <span class="key-size">{key.size ?? 'N/A'}</span>
                                <button 
                                    class="delete-key-btn" 
                                    onclick={() => deleteKey(key.key)}
                                    aria-label="Delete key"
                                >
                                    <iconify-icon icon="mdi:delete" width="16" height="16"></iconify-icon>
                                </button>
                            </div>
                            {#if key.expanded && key.value !== undefined}
                                <div class="key-value">
                                    <pre>{formatValue(key.value)}</pre>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Delete Queue (below table) -->
            {#if deleteQueue.size > 0}
                <div class="delete-queue">
                    <div class="queue-header">
                        <span>Delete Queue ({deleteQueue.size} item{deleteQueue.size > 1 ? 's' : ''})</span>
                        <div class="queue-actions">
                            <button onclick={executeDeleteQueue} class="danger-btn" disabled={loading}>
                                <iconify-icon icon="mdi:delete" width="16" height="16"></iconify-icon>
                                Execute
                            </button>
                            <button onclick={clearDeleteQueue} class="cancel-btn" disabled={loading}>
                                <iconify-icon icon="mdi:close" width="16" height="16"></iconify-icon>
                                Clear
                            </button>
                        </div>
                    </div>
                    <div class="queue-list">
                        {#each Array.from(deleteQueue) as queuedKey}
                            <span class="queue-item">{queuedKey}</span>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</section>

<style>
    .redis-inspector {
        border-radius: 0.5rem;
        background: var(--bg);
        margin-top: 2rem;
        overflow: hidden;
    }

    .redis-inspector.expanded {
        box-shadow: 0 0 0 2px rgba(0,0,0,0.02), 0 4px 14px rgba(0,0,0,0.04);
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: linear-gradient(135deg, #dc382c 0%, #a62c21 100%);
        color: white;
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
    }

    .toggle-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 0.25rem;
    }

    .toggle-btn:hover {
        opacity: 0.8;
    }

    .content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .message {
        padding: 0.75rem;
        border-radius: 0.25rem;
        font-family: var(--font-ui);
    }

    .message.error {
        background: #ff6b6b22;
        border: 1px solid #ff6b6b;
        color: #ff6b6b;
    }

    .loading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        padding: 1rem;
        color: var(--accent);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
    }

    .stat-card {
        background: var(--bg);
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .stat-label {
        font-size: 0.75rem;
        color: var(--font-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .stat-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--accent);
        font-family: var(--font-ui);
    }

    .scanner {
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        padding: 1rem;
    }

    .scanner h3 {
        margin: 0 0 0.75rem 0;
        font-family: var(--font-ui);
        font-size: 1rem;
        color: var(--contrast);
    }

    .scanner-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .scanner-options {
        margin-top: 0.75rem;
        display: flex;
        gap: 1rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.85rem;
        color: var(--font-color);
    }

    .checkbox-label input[type="checkbox"] {
        cursor: pointer;
        width: 16px;
        height: 16px;
    }

    .checkbox-label span {
        user-select: none;
    }

    .pattern-input {
        flex: 1;
        min-width: 200px;
        padding: 0.5rem;
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        background: var(--bg);
        color: var(--contrast);
        font-family: 'Fira Code', monospace;
    }

    .limit-input {
        width: 100px;
        padding: 0.5rem;
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        background: var(--bg);
        color: var(--contrast);
    }

    .scan-btn, .danger-btn {
        padding: 0.5rem 1rem;
        border: 2px solid var(--outline);
        border-radius: 0.25rem;
        background: var(--bg);
        color: var(--accent);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-family: var(--font-ui);
    }

    .scan-btn:hover {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--bg);
    }

    .danger-btn {
        color: #ff6b6b;
    }

    .danger-btn:hover {
        border-color: #ff6b6b;
        background: #ff6b6b;
        color: white;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .cancel-btn {
        padding: 0.5rem 1rem;
        border: 2px solid var(--outline);
        border-radius: 0.25rem;
        background: var(--bg);
        color: #ff9800;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-family: var(--font-ui);
    }

    .cancel-btn:hover {
        border-color: #ff9800;
        background: #ff9800;
        color: white;
    }

    .delete-queue {
        border: 2px solid #ff6b6b;
        border-radius: 0.25rem;
        padding: 0.75rem;
        background: rgba(255, 107, 107, 0.05);
    }

    .queue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-family: var(--font-ui);
        font-weight: 600;
        color: #ff6b6b;
    }

    .queue-actions {
        display: flex;
        gap: 0.5rem;
    }

    .queue-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        max-height: 150px;
        overflow-y: auto;
    }

    .queue-item {
        background: var(--bg);
        border: 1px solid #ff6b6b;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
        font-family: 'Fira Code', monospace;
        font-size: 0.75rem;
        color: #ff6b6b;
    }

    .keys-list {
        border: 1px solid var(--outline);
        border-radius: 0.25rem;
        overflow: hidden;
    }

    .keys-header {
        display: grid;
        grid-template-columns: auto 2fr 1fr 1fr 1fr auto;
        gap: 0.5rem;
        padding: 0.75rem;
        background: var(--font-dim);
        font-family: var(--font-ui);
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--contrast);
        border-bottom: 1px solid var(--outline);
        align-items: center;
    }

    .checkbox-col {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .key-item {
        border-bottom: 1px solid var(--outline);
        transition: background-color 0.2s;
    }

    .key-item.queued {
        background: rgba(255, 107, 107, 0.1);
    }

    .key-item:last-child {
        border-bottom: none;
    }

    .key-row {
        display: grid;
        grid-template-columns: auto 2fr 1fr 1fr 1fr auto;
        gap: 0.5rem;
        padding: 0.75rem;
        align-items: center;
    }

    .key-checkbox {
        cursor: pointer;
        width: 16px;
        height: 16px;
        margin: 0;
    }

    .key-name {
        background: none;
        border: none;
        color: var(--accent);
        font-family: 'Fira Code', monospace;
        font-size: 0.85rem;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0;
        word-break: break-all;
    }

    .key-name:hover {
        text-decoration: underline;
    }

    .key-type, .key-ttl, .key-size {
        font-size: 0.85rem;
        color: var(--font-color);
        font-family: var(--font-ui);
    }

    .delete-key-btn {
        background: none;
        border: 1px solid var(--outline);
        color: #ff6b6b;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
    }

    .delete-key-btn:hover {
        border-color: #ff6b6b;
        background: #ff6b6b;
        color: white;
    }

    .key-value {
        padding: 0.75rem;
        background: black;
        border-top: 1px solid var(--outline);
    }

    .key-value pre {
        margin: 0;
        font-family: 'Fira Code', monospace;
        font-size: 0.75rem;
        color: var(--contrast);
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 300px;
        overflow-y: auto;
    }

    @media (max-width: 768px) {
        .keys-header, .key-row {
            grid-template-columns: auto 1fr auto;
        }

        .key-type, .key-ttl, .key-size {
            display: none;
        }

        .scanner-controls {
            flex-direction: column;
        }

        .pattern-input, .limit-input {
            width: 100%;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
