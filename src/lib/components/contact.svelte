<script lang="ts">
import { fetchJson, ApiError } from '$lib/apiClient';
export let initialStatus: string = 'Ready';
let status: string = initialStatus;
let showForm = false;

	const handleSubmit = async (event: Event) => {
		status = 'Sending...';
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const data = new FormData(form);
		const json = JSON.stringify(Object.fromEntries(data.entries()));

		try {
			const result = await fetchJson('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: json
			});

			if (result && result.success) {
				status = 'Message sent! 🎉';
				form.reset();
			} else {
				console.error('Submission failed:', result);
				status = `Failed: ${result.message || 'Please try again.'}`;
			}
		} catch (error) {
			console.error('Error submitting form:', error);
			if (error instanceof ApiError) status = `Failed: ${error.body?.message || error.message}`;
			else status = 'Failed: An error occurred.';
		}
	};
</script>

<div class="contact-form">
	{#if !showForm}
		<button type="button" class="primary" onclick={() => showForm = true}>Get in touch</button>
	{:else}
		<form onsubmit={handleSubmit}>
			<p>Status: <span class:fail={status.startsWith('Failed')}>{status}</span></p>
			<input type="hidden" name="access_key" value="489cc2ff-5a51-4737-a5c9-8491e6cf8038" />
			<textarea name="message" placeholder="Hey dude, stop planting mint directly in soil, its taking over my backyard!" required></textarea>
			<div>
				<input id="email" name="email" type="email" placeholder="angry@neighbor.com" required />
				<button type="submit"> Submit </button>
			</div>
		</form>
	{/if}
</div>

<style>
.contact-form{display:flex;align-items:center;flex-direction:column;gap:1rem}.contact-form button{width:fit-content}.contact-form button:hover{color:var(--accent);border:1px solid var(--accent)}.contact-form span{color:var(--accent)}.contact-form span.fail{color:salmon}.contact-form form{display:flex;flex-direction:column;gap:1rem}.contact-form form *:focus{outline:var(--accent) 1px solid}.contact-form form textarea{min-height:5rem;max-height:15rem;font-family:var(--font-read);font-size:.9rem;color:var(--contrast);padding:.5rem;background-color:var(--body-bg);border:1px solid var(--outline);border-radius:.5rem;resize:vertical}.contact-form form div{display:flex;flex-wrap:wrap;gap:1rem}.contact-form form div *{padding:.5rem}.contact-form form input{max-width:11rem;flex-grow:1;font-family:var(--font-read);color:var(--contrast);background-color:var(--body-bg);border:1px solid var(--outline);border-radius:.5rem}.contact-form form button{font-family:var(--font-ui);font-size:1rem;color:var(--accent-dim);background-color:var(--bg);border:1px solid var(--accent-dim);border-radius:.5rem;cursor:pointer;transition:color .2s}.contact-form form button:hover{color:var(--accent);border:1px solid var(--accent)}.contact-form p{margin:0;font-size:.9rem}
</style>
