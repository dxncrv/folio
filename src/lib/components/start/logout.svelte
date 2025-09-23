<script lang="ts">
let { show, onCancel, onConfirm } = $props();
</script>

{#if show}
	<div class="modal-backdrop">
		<div class="logout-modal">
			<h3>Confirm Logout</h3>
			<p>Are you sure you want to sign out?</p>
			<div class="modal-actions">
				<button onclick={onCancel}>Cancel</button>
				<button onclick={onConfirm}>Sign Out</button>
			</div>
		</div>
	</div>
{/if}

<style>.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:60}.logout-modal{background:var(--bg);border:1px solid var(--outline);border-radius:.5rem;padding:2rem;max-width:300px;width:90%;text-align:center}.logout-modal h3{font-family:var(--font-ui);margin:0 0 1rem 0;color:var(--contrast)}.logout-modal p{font-family:var(--font-read);margin:0 0 1.5rem 0;color:var(--font-color)}.modal-actions{display:flex;gap:1rem;justify-content:center}.modal-actions button{background:none;color:var(--contrast);padding:.5rem 1rem;border:2px solid var(--outline);border-radius:.5rem;cursor:pointer;transition:all .3s ease;font-family:var(--font-ui)}.modal-actions button:hover{color:var(--accent);border-color:var(--accent);background:var(--bg)}.modal-actions button:last-child{color:#ff6b6b;border-color:var(--outline)}.modal-actions button:last-child:hover{color:#ff6b6b;border-color:#ff6b6b;background:var(--bg)}</style>
