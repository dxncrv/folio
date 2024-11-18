<script lang="ts">
	import { Email, GitHub, LinkedIn, Instagram } from '$lib/icons';
	let status = 'Ready';

	const handleSubmit = async (event: Event) => {
		status = 'Sending...';
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const data = new FormData(form);
		const json = JSON.stringify(Object.fromEntries(data.entries()));

		const response = await fetch('https://api.web3forms.com/submit', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: json
		});

		const result = await response.json();
		if (result.success) {
			status = 'Message sent! 🎉';
		} else {
			status = 'Failed';
		}
	};
</script>

<svelte:head>
	<title>Contact</title>
</svelte:head>

<main>
	<h2>Say hi</h2>
	<form onsubmit={handleSubmit}>
		<input type="hidden" name="access_key" value="489cc2ff-5a51-4737-a5c9-8491e6cf8038" />
		<textarea placeholder=""></textarea>
		<div>
			<label for="email">Address:</label>
			<input type="email" placeholder="Email" />
			<p>Status: <span class:fail={status === 'Failed'}>{status}</span></p>
			<button type="submit"> Submit </button>
		</div>
	</form>
	<h2>Connect with me</h2>
	<div class="socials">
		<a href="mailto:doncorve@gmail.com" target="_blank" rel="noopener noreferrer">
			<Email />
		</a>
		<a href="https://github.com/dxncrv" target="_blank" rel="noopener noreferrer">
			<GitHub />
		</a>
		<a href="https://www.linkedin.com/in/dxncrv/" target="_blank" rel="noopener noreferrer">
			<LinkedIn />
		</a>

		<a href="https://www.instagram.com/dxncrv/" target="_blank" rel="noopener noreferrer">
			<Instagram />
		</a>
	</div>
</main>

<style>
	span {
		color: var(--accent);
	}
	span.fail {
		color: salmon;
	}
	main {
		gap: 2rem;
		display: flex;
		margin: 2rem auto;
		flex-direction: column;
		border: 1px solid var(--outline);
		background: var(--bg);
		border-radius: 1rem;
		padding: 2rem 0;
	}
	main > * {
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
		flex-grow: 1;
		font-family: var(--font-read);
		color: var(--contrast);
		background-color: var(--body-bg);
		border: 1px solid var(--outline);
		border-radius: 0.5rem;
		resize: vertical;
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

	div.socials {
		display: flex;
		color: var(--accent-dim);
		gap: 1.5rem;
	}
	div.socials a {
		font-size: 1.5rem;
		color: var(--accent-dim);
		transition: color 0.2s;
	}
	div.socials a:hover {
		color: var(--accent);
	}

	@media (max-width: 768px) {
		main {
			margin: 2rem 1rem;
		}
	}
</style>
