<script lang="ts">
	import type { Project } from '$lib/types';

	interface Props {
		project?: Project;
		mode: 'create' | 'edit';
		onsubmit: (project: Project) => void;
		oncancel: () => void;
	}

	let { project = undefined, mode, onsubmit, oncancel }: Props = $props();

	let formData = $state<Project>({
		title: project?.title || '',
		tags: project?.tags || ['Code'],
		image: project?.image || '',
		link: project?.link || '',
		git: project?.git || '',
		yt: project?.yt || '',
		awards: project?.awards || [],
		desc: project?.desc || { code: '', design: '' },
		tech: project?.tech || { code: [], design: [] },
		study: project?.study || {}
	});

	let newTag = $state('');
	let newAward = $state('');
	let newTechCode = $state('');
	let newTechDesign = $state('');

	function addTag() {
		if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
			formData.tags = [...formData.tags, newTag.trim()];
			newTag = '';
		}
	}

	function removeTag(index: number) {
		formData.tags = formData.tags.filter((_, i) => i !== index);
	}

	function addAward() {
		if (newAward.trim()) {
			formData.awards = [...(formData.awards || []), newAward.trim()];
			newAward = '';
		}
	}

	function removeAward(index: number) {
		formData.awards = formData.awards?.filter((_, i) => i !== index) || [];
	}

	function addTechCode() {
		if (newTechCode.trim()) {
			formData.tech.code = [...(formData.tech.code || []), newTechCode.trim()];
			newTechCode = '';
		}
	}

	function removeTechCode(index: number) {
		formData.tech.code = formData.tech.code?.filter((_, i) => i !== index) || [];
	}

	function addTechDesign() {
		if (newTechDesign.trim()) {
			formData.tech.design = [...(formData.tech.design || []), newTechDesign.trim()];
			newTechDesign = '';
		}
	}

	function removeTechDesign(index: number) {
		formData.tech.design = formData.tech.design?.filter((_, i) => i !== index) || [];
	}

	function handleSubmit() {
		// Validate required fields
		if (!formData.title.trim()) {
			alert('Title is required');
			return;
		}
		if (!formData.image.trim()) {
			alert('Image is required');
			return;
		}
		if (formData.tags.length === 0) {
			alert('At least one tag is required');
			return;
		}
		
		onsubmit(formData);
	}

	function handleCancel() {
		oncancel();
	}

	// Helper function to add item on Enter key
	function handleKeyPress(event: KeyboardEvent, addFunction: () => void) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addFunction();
		}
	}

	// Handle Escape key to close modal
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			oncancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="project-form">
	<h2>{mode === 'create' ? 'Create New Project' : 'Edit Project'}</h2>
	
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<div class="form-group">
			<label for="title">Title:</label>
			<input id="title" type="text" bind:value={formData.title} required />
		</div>

		<div class="form-group">
			<label for="image">Image:</label>
			<input id="image" type="text" bind:value={formData.image} required />
		</div>

		<div class="form-group">
			<label for="link">Link:</label>
			<input id="link" type="url" bind:value={formData.link} />
		</div>

		<div class="form-group">
			<label for="git">Git Repository:</label>
			<input id="git" type="url" bind:value={formData.git} />
		</div>

		<div class="form-group">
			<label for="yt">YouTube URL:</label>
			<input id="yt" type="url" bind:value={formData.yt} />
		</div>

		<div class="form-group">
			<span class="label">Tags:</span>
			<div class="tags-container">
				{#each formData.tags as tag, index}
					<span class="tag">
						{tag}
						<button type="button" onclick={() => removeTag(index)}>×</button>
					</span>
				{/each}
			</div>
			<div class="add-item">
				<label for="add-tag">Add tag:</label>
				<input 
					id="add-tag" 
					type="text" 
					bind:value={newTag} 
					placeholder="Add tag" 
					onkeydown={(e) => handleKeyPress(e, addTag)}
				/>
				<button type="button" onclick={addTag}>Add</button>
			</div>
		</div>

		<div class="form-group">
			<span class="label">Awards:</span>
			<div class="awards-container">
				{#each formData.awards || [] as award, index}
					<div class="award-item">
						<span>{award}</span>
						<button type="button" onclick={() => removeAward(index)}>×</button>
					</div>
				{/each}
			</div>
			<div class="add-item">
				<label for="add-award">Add award URL:</label>
				<input 
					id="add-award" 
					type="url" 
					bind:value={newAward} 
					placeholder="Add award URL" 
					onkeydown={(e) => handleKeyPress(e, addAward)}
				/>
				<button type="button" onclick={addAward}>Add</button>
			</div>
		</div>

		<div class="form-group">
			<label for="desc-code">Description (Code):</label>
			<textarea id="desc-code" bind:value={formData.desc.code} rows="3"></textarea>
		</div>

		<div class="form-group">
			<label for="desc-design">Description (Design):</label>
			<textarea id="desc-design" bind:value={formData.desc.design} rows="3"></textarea>
		</div>

		<div class="form-group">
			<span class="label">Technologies (Code):</span>
			<div class="tech-container">
				{#each formData.tech.code || [] as tech, index}
					<span class="tech-item">
						{tech}
						<button type="button" onclick={() => removeTechCode(index)}>×</button>
					</span>
				{/each}
			</div>
			<div class="add-item">
				<label for="add-tech-code">Add technology:</label>
				<input 
					id="add-tech-code" 
					type="text" 
					bind:value={newTechCode} 
					placeholder="Add technology" 
					onkeydown={(e) => handleKeyPress(e, addTechCode)}
				/>
				<button type="button" onclick={addTechCode}>Add</button>
			</div>
		</div>

		<div class="form-group">
			<span class="label">Technologies (Design):</span>
			<div class="tech-container">
				{#each formData.tech.design || [] as tech, index}
					<span class="tech-item">
						{tech}
						<button type="button" onclick={() => removeTechDesign(index)}>×</button>
					</span>
				{/each}
			</div>
			<div class="add-item">
				<label for="add-tech-design">Add technology:</label>
				<input 
					id="add-tech-design" 
					type="text" 
					bind:value={newTechDesign} 
					placeholder="Add technology" 
					onkeydown={(e) => handleKeyPress(e, addTechDesign)}
				/>
				<button type="button" onclick={addTechDesign}>Add</button>
			</div>
		</div>

		<div class="form-actions">
			<button type="submit" class="submit-btn">
				{mode === 'create' ? 'Create Project' : 'Update Project'}
			</button>
			<button type="button" class="cancel-btn" onclick={handleCancel}>Cancel</button>
		</div>
	</form>
</div>

<style>
	.project-form {
		max-width: 700px;
		margin: 0 auto;
		padding: 3rem;
		background: var(--bg);
		border: 3px solid var(--accent);
		box-shadow: 8px 8px 0 var(--accent-dim);
	}

	.project-form h2 {
		color: var(--contrast);
		font-family: var(--font-ui);
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 2rem;
		margin-bottom: 2rem;
		text-align: center;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label, .label {
		display: block;
		margin-bottom: 0.75rem;
		font-weight: bold;
		color: var(--contrast);
		font-family: var(--font-ui);
		text-transform: uppercase;
		letter-spacing: 1px;
		font-size: 1rem;
	}

	input, textarea {
		width: 100%;
		padding: 1rem;
		border: 2px solid var(--outline);
		background: var(--bg);
		color: var(--contrast);
		font-size: 1rem;
		font-family: var(--font-read);
		transition: all 0.1s ease;
		box-shadow: 4px 4px 0 var(--font-dim);
	}

	input:focus, textarea:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 4px 4px 0 var(--accent-dim);
		transform: translate(-2px, -2px);
	}

	textarea {
		resize: vertical;
		min-height: 120px;
		line-height: 1.5;
	}

	.tags-container, .awards-container, .tech-container {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.tag, .tech-item {
		background: var(--accent);
		color: var(--bg);
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		border: 2px solid var(--accent);
		box-shadow: 3px 3px 0 var(--accent-dim);
	}

	.tag button, .tech-item button {
		background: none;
		border: none;
		color: var(--bg);
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		transition: all 0.1s ease;
	}

	.tag button:hover, .tech-item button:hover {
		transform: scale(1.2);
	}

	.award-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg);
		border: 2px solid var(--outline);
		width: 100%;
		margin-bottom: 0.5rem;
		box-shadow: 3px 3px 0 var(--font-dim);
	}

	.award-item span {
		flex: 1;
		word-break: break-all;
		color: var(--contrast);
		font-family: var(--font-read);
	}

	.award-item button {
		background: #ff6b6b;
		border: 2px solid #ff6b6b;
		color: var(--bg);
		padding: 0.5rem;
		cursor: pointer;
		font-weight: bold;
		font-size: 1rem;
		box-shadow: 2px 2px 0 #cc5555;
		transition: all 0.1s ease;
	}

	.award-item button:hover {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 #cc5555;
	}

	.add-item {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-top: 1rem;
	}

	.add-item label {
		margin-bottom: 0;
		font-size: 1rem;
		white-space: nowrap;
		min-width: fit-content;
		color: var(--contrast);
	}

	.add-item input {
		flex: 1;
	}

	.add-item button {
		padding: 1rem 1.5rem;
		background: var(--bg);
		color: var(--accent);
		border: 2px solid var(--accent);
		cursor: pointer;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 1px;
		box-shadow: 3px 3px 0 var(--accent-dim);
		transition: all 0.1s ease;
	}

	.add-item button:hover {
		background: var(--accent);
		color: var(--bg);
		transform: translate(1px, 1px);
		box-shadow: 2px 2px 0 var(--accent-dim);
	}

	.form-actions {
		display: flex;
		gap: 2rem;
		justify-content: center;
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid var(--outline);
	}

	.submit-btn {
		padding: 1.5rem 3rem;
		background: var(--accent);
		color: var(--bg);
		border: 2px solid var(--accent);
		cursor: pointer;
		font-size: 1.2rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 2px;
		box-shadow: 6px 6px 0 var(--accent-dim);
		transition: all 0.1s ease;
	}

	.submit-btn:hover {
		transform: translate(3px, 3px);
		box-shadow: 3px 3px 0 var(--accent-dim);
	}

	.cancel-btn {
		padding: 1.5rem 3rem;
		background: var(--bg);
		color: var(--font-color);
		border: 2px solid var(--outline);
		cursor: pointer;
		font-size: 1.2rem;
		font-family: var(--font-ui);
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 2px;
		box-shadow: 6px 6px 0 var(--font-dim);
		transition: all 0.1s ease;
	}

	.cancel-btn:hover {
		background: var(--outline);
		color: var(--bg);
		transform: translate(3px, 3px);
		box-shadow: 3px 3px 0 var(--font-dim);
	}
</style>
