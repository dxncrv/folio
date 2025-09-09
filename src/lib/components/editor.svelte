<script lang="ts">
	import { EditorTool } from '$lib/editorTools';

	let { initialContent = $bindable(''), slug = '' } = $props();

	let editing = $state(false);
	let content = $state(initialContent);
	let loading = $state(false);
	let error = $state('');
	let exists = $derived(initialContent.trim().length > 0);

	// textarea DOM reference so EditorTool can inspect selectionStart/End
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	$effect(() => {
		if (!editing) {
			content = initialContent;
		}
	});

	// Listen for media insertion
	$effect(() => {
		const handleInsertMedia = (event: Event) => {
			const media = (event as CustomEvent).detail as { id: string; type: string; path: string; alt?: string; caption?: string };
			const insertText = media.type === 'image' 
				? `![${media.alt || media.caption || 'Image'}](/${media.path})`
				: `<video controls><source src="/${media.path}" type="video/${media.path.split('.').pop()}"></video>`;
			const res = EditorTool.insertText(textareaRef, content, insertText);
			content = res.content;
			textareaRef?.focus();
			if (textareaRef) {
				textareaRef.selectionStart = textareaRef.selectionEnd = res.cursor;
			}
		};
		window.addEventListener('insert-media', handleInsertMedia as EventListener);
		return () => window.removeEventListener('insert-media', handleInsertMedia as EventListener);
	});

	import { fetchJson } from '$lib/apiClient';

	async function apiCall(endpoint: string, options: RequestInit) {
		return fetchJson(endpoint, options);
	}

	async function save() {
		loading = true;
		error = '';
		try {
			await apiCall(exists ? `/api/case-studies/${slug}` : '/api/case-studies', {
				method: exists ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug, content })
			});
			initialContent = content;
			editing = false;
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
			await apiCall(`/api/case-studies/${slug}`, { method: 'DELETE' });
			content = '';
			initialContent = '';
			editing = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="case-study-editor" class:editing={editing}>
  {#if error}
    <div class="error">{error}</div>
  {/if}
  {#if editing}
  <div class="actions">
	  <div class="right-group" class:editing={editing}>
		  <button class="delete" onclick={remove} disabled={loading} aria-label="Delete case study">
			  <iconify-icon icon="line-md:remove" width="16" height="16"></iconify-icon>
		  </button>
		  <button class="save" onclick={save} disabled={loading} aria-label="Save case study">
			  <iconify-icon icon="line-md:uploading-loop" width="16" height="16"></iconify-icon>
			</button>
			<button class="cancel" onclick={() => { editing = false; content = initialContent; error = ''; }} disabled={loading} aria-label="Cancel editing">
				<iconify-icon icon="line-md:cancel" width="16" height="16"></iconify-icon>
			</button>
		</div>
		<div class="left-group">
			<button class="tool" aria-label="Image tool" onclick={() => {
				const res = EditorTool.insertImage(textareaRef, content);
				content = res.content;
				// focus and set cursor on next tick
				textareaRef?.focus();
				if (textareaRef) {
					textareaRef.selectionStart = textareaRef.selectionEnd = res.cursor;
				}
			}}>
			<iconify-icon icon="line-md:image-twotone" width="16" height="16"></iconify-icon>
			</button>
			<button class="tool" aria-label="Video tool" onclick={() => {
				const res = EditorTool.insertVideo(textareaRef, content);
				content = res.content;
				textareaRef?.focus();
				if (textareaRef) {
					textareaRef.selectionStart = textareaRef.selectionEnd = res.cursor;
				}
			}}>
			<iconify-icon icon="line-md:play" width="16" height="16"></iconify-icon>
			</button>
			<button class="tool" aria-label="Link tool" onclick={() => {
				const res = EditorTool.insertLink(textareaRef, content);
				content = res.content;
				textareaRef?.focus();
				if (textareaRef) {
					textareaRef.selectionStart = textareaRef.selectionEnd = res.cursor;
				}
			}}>
			<iconify-icon icon="line-md:external-link" width="16" height="16"></iconify-icon>
			</button>
			</div>
    </div>
	<textarea bind:value={content} rows="10" class="fira-code-normal" bind:this={textareaRef}></textarea>
  {:else}
  <p>Study editor</p>
    <div class="actions">
      <button class="edit" onclick={() => editing = true} aria-label="Edit case study">
		<iconify-icon icon="line-md:watch-loop" width="16" height="16"></iconify-icon>
	  </button>
    </div>
  {/if}
</div>

<style>
	p {
		width: 100%;
		align-self: center;
		margin-left: 0.5rem;
	}
	.case-study-editor {
		display: flex;
		justify-content: end;
		margin-top: 0.5rem;
		border: 2px solid var(--font-dim);
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: var(--body-bg);
	}
	.case-study-editor.editing {
		flex-direction: column;
		align-items: end;
	}

	.case-study-editor textarea {
		height: auto;
		width: 100%;
		resize: vertical;
		margin-top: 0.5rem;
		padding: 0.5rem;
		border: 2px solid var(--font-dim);
		border-radius: 0.5rem;
		background: var(--bg);
		color: var(--contrast);
		font-size: 0.875rem;
		font-family: 'Fira Code', monospace;
	}

	.case-study-editor .actions {
		width: 100%;
		flex-direction: row-reverse;
		justify-content: space-between;
		display: flex;
	}

	.case-study-editor .actions .left-group,
	.case-study-editor .actions .right-group {
		display: flex;
		flex: 0 0 auto;
	}

	.case-study-editor .actions button {
		background: var(--font-dim);
		padding: 0.35rem 0.75rem;
		border: 2px solid transparent;
	}

	.case-study-editor .actions button:first-child {
		border-radius: 0.5rem 0 0 0.5rem;
	}

	.case-study-editor .actions button:last-child {
		border-radius: 0 0.5rem 0.5rem 0;
	}

	.case-study-editor .actions button:only-child {
		border-radius: 0.5rem;
	}

	button.edit,
	button.save {
		background: none;
		color: var(--accent);
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}

	button.edit:hover,
	button.save:hover {
		border-color: var(--accent);
		background: var(--bg);
	}

	button.delete,
	button.cancel {
		background: none;
		padding: 0.5rem 1rem;
		border: 2px solid var(--outline);
	}

	button.delete {
		color: #ff6b6b;
	}

	button.delete:hover {
		border-color: #ff6b6b;
		background: var(--bg);
	}

	button.cancel {
		color: #ff9800;
	}

	button.cancel:hover {
		border-color: #ff9800;
		background: var(--bg);
	}

	button.tool {
		color: var(--contrast);
		padding: 0.35rem 0.75rem;
		border: 2px solid transparent;
	}
	button.tool:hover {
		border-color: var(--accent);
		background: var(--bg);
	}

	.case-study-editor .error {
		color: var(--error);
		margin-bottom: 0.5rem;
	}

	.right-group.editing {
		outline: 2px solid hsl(220, 100%, 50%);
		outline-offset: 2px;
		border-radius: 0.5rem;
	}
</style>
