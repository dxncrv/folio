// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type PocketBase from 'pocketbase';
import type { TypedPocketBase } from '$lib/pocketbase-types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			pb: TypedPocketBase;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '@sveltejs/enhanced-img' {
  export const enhanced: any;
}

export {};
