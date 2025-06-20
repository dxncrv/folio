<script lang="ts">
	import Socials from "$lib/components/socials.svelte";

	let status = 'Ready';

	const handleSubmit = async (event: Event) => {
		status = 'Sending...';
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const data = new FormData(form);
		const json = JSON.stringify(Object.fromEntries(data.entries()));

		try {
			const response = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: json
			});

			const result = await response.json();

			if (response.ok && result.success) {
				status = 'Message sent! 🎉';
				form.reset();
			} else {
				console.error('Submission failed:', result);
				status = `Failed: ${result.message || 'Please try again.'}`;
			}
		} catch (error) {
			console.error('Error submitting form:', error);
			status = 'Failed: An error occurred.';
		}
	};
</script>

<svelte:head>
	<title>Contact</title>
</svelte:head>

<main>
	<div class="wrapper">
		<h2>Say hi</h2>
		<form onsubmit={handleSubmit}>
			<input type="hidden" name="access_key" value="489cc2ff-5a51-4737-a5c9-8491e6cf8038" />
			<textarea name="message" placeholder="Your message here..."></textarea>
			<div>
				<label for="email">Address:</label>
				<input id="email" name="email" type="email" placeholder="Email" required />
				<p>Status: <span class:fail={status.startsWith('Failed')}>{status}</span></p>
				<button type="submit"> Submit </button>
			</div>
		</form>
		<h2>Connect with me</h2>
		<Socials />
	</div>
</main>

<style>
	.wrapper {
		width: fit-content;
		gap: 2rem;
		display: flex;
		margin: 2rem auto;
		flex-direction: column;
		border: 1px solid var(--outline);
		background: var(--bg);
		border-radius: 1rem;
		padding: 2rem 0;
	}
	span {
		color: var(--accent);
	}
	span.fail {
		color: salmon;
	}
	main {
		padding: 0 1rem;
	}
	.wrapper > * {
		margin: 0 2rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	form *:focus {
		outline: var(--accent) 1px solid;
	}
	form textarea {
		min-height: 10rem;
		max-height: 20rem;

		font-family: var(--font-read);
		color: var(--contrast);
		padding: 1rem;
		background-color: var(--body-bg);
		border: 1px solid var(--outline);
		border-radius: 1.75rem;
		resize: vertical;
	}
	form div {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
	form div * {
		padding: 0.5rem;
	}
	form input {
		max-width: 11rem;
		flex-grow: 1;
		font-family: var(--font-read);
		color: var(--contrast);
		background-color: var(--body-bg);
		border: 1px solid var(--outline);
		border-radius: 0.5rem;
	}
	form label {
		font-family: var(--font-read);
		color: var(--contrast);
	}
	form button {
		min-width: 6rem;
		font-family: var(--font-ui);
		font-size: 1rem;
		color: var(--accent-dim);
		background-color: var(--bg);
		border: 1px solid var(--accent-dim);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: color 0.2s;
	}
	form button:hover {
		color: var(--accent);
		border: 1px solid var(--accent);
	}
</style>
