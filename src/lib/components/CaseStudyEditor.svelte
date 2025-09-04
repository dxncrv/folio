<script lang="ts">
import { CaseStudies } from '$lib/caseStudiesStore';

export let projectTitle: string;
export let initialContent: string = '';
export let slug: string = '';

let editing = false;
let content = initialContent;
let loading = false;
let error = '';
let exists = false;
let fetched = false;
let lastSlug = '';

// Fetch from Redis when slug changes
$: if (slug && slug !== lastSlug) {
  lastSlug = slug;
  fetchFromRedis();
}
async function fetchFromRedis() {
  if (fetched) return;
  fetched = true;
  const cs = await CaseStudies.fetchBySlug(slug);
  exists = !!(cs && cs.content);
}

function startEdit() {
  editing = true;
}

function cancelEdit() {
  editing = false;
  content = initialContent;
  error = '';
}

async function save() {
  loading = true;
  error = '';
  try {
    let res;
    if (exists) {
      res = await fetch(`/api/case-studies/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content })
      });
    } else {
      res = await fetch('/api/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content })
      });
    }
    if (!res.ok) {
      let msg = exists ? 'Failed to save' : 'Failed to create';
      try {
        const data = await res.json();
        msg = data.error || msg;
      } catch {}
      throw new Error(msg);
    }
    initialContent = content;
    editing = false;
    exists = true;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    loading = false;
  }
}

async function remove() {
  if (!confirm('Delete this case study?')) return;
  loading = true;
  error = '';
  try {
    const res = await fetch(`/api/case-studies/${slug}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    content = '';
    initialContent = '';
    editing = false;
    exists = false;
    fetched = false;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    loading = false;
  }
}
</script>

<div class="case-study-editor">
  <h4>Case Study: {projectTitle}</h4>
  {#if error}
    <div class="error">{error}</div>
  {/if}
  {#if editing}
    <textarea bind:value={content} rows="10" class="fira-code-normal"></textarea>
    <div class="actions">
      <button on:click={save} disabled={loading}>Save</button>
      <button on:click={cancelEdit} disabled={loading}>Cancel</button>
      <button on:click={remove} disabled={loading}>Delete</button>
    </div>
  {:else}
    <div class="case-study-status">
      Status: <span class:live={exists} class:local={!exists}>{exists ? 'live' : 'local'}</span>
    </div>
    <div class="actions">
      <button on:click={startEdit}>Edit</button>
    </div>
  {/if}
</div>

<style>
.case-study-editor { margin-top: 1em; border: 1px solid var(--accent); padding: 1em; border-radius: 8px; background: var(--bg2); }
.case-study-editor textarea { width: 100%; font-family: inherit; margin-bottom: 0.5em; }
.case-study-editor .actions { margin-bottom: 0.5em; }
.case-study-editor .error { color: var(--error); margin-bottom: 0.5em; }
.case-study-editor .case-study-status { margin-bottom: 0.5em; }
.case-study-editor .live { color: #4caf50; font-weight: bold; }
.case-study-editor .local { color: #ff9800; font-weight: bold; }
</style>
