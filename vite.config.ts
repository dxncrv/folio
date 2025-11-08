import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		warmup: {
			clientFiles: [
				'./src/lib/store.svelte.ts',
				'./src/lib/components/chat.svelte',
				'./src/lib/components/editor.svelte',
				'./src/routes/+layout.svelte'
			],
			ssrFiles: [
				'./src/routes/(private)/start/+page.server.ts'
			]
		}
	},
	optimizeDeps: {
		include: ['ioredis']
	},
	plugins: [
    enhancedImages(),
    sveltekit()
  ]
});
