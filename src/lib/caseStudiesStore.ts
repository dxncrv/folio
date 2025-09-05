import { writable } from 'svelte/store';

export const CaseStudies = (() => {
  const { subscribe, set } = writable([]);

  async function fetchAll() {
    const res = await fetch('/api/case-studies');
    if (res.ok) {
      set(await res.json());
    }
  }

  async function fetchBySlug(slug: string) {
    const res = await fetch(`/api/case-studies/${slug}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  }

  return {
    subscribe,
    fetchAll,
    fetchBySlug
  };
})();
