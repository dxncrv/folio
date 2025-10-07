import Redis from 'ioredis';
import type { Project, Media } from '$lib/types';
import { env } from '$env/dynamic/private';

let redisClient: Redis | null = null;

export const getRedisClient = () => {
    if (!redisClient) {
        if (!env.REDIS_URL || env.REDIS_URL === 'your_redis_url_here') {
            throw new Error('Redis is not configured. Set REDIS_URL environment variable.');
        }
        redisClient = new Redis(env.REDIS_URL);
        redisClient.on('error', (err) => console.error('Redis connection error:', err));
        redisClient.on('connect', () => console.log('Connected to Redis'));
    }
    return redisClient;
};

import type { CaseStudy } from '$lib/types';

// Small generic list store helper to avoid repeating CRUD logic for array-backed keys.
function createListStore<T>(key: string, idSelector: (item: T) => string) {
    const client = getRedisClient;

    async function get(): Promise<T[]> {
        const data = await client().get(key);
        return data ? JSON.parse(data) as T[] : [];
    }

    async function set(items: T[]): Promise<void> {
        await client().set(key, JSON.stringify(items));
    }

    async function add(item: T): Promise<T[]> {
        const items = await get();
        items.push(item);
        await set(items);
        return items;
    }

    async function update(id: string, updated: T): Promise<T[]> {
        const items = await get();
        const index = items.findIndex(i => idSelector(i) === id);
        if (index === -1) throw new Error(`${key} item with id "${id}" not found`);
        items[index] = updated;
        await set(items);
        return items;
    }

    async function remove(id: string): Promise<T[]> {
        const items = await get();
        const filtered = items.filter(i => idSelector(i) !== id);
        if (filtered.length === items.length) throw new Error(`${key} item with id "${id}" not found`);
        await set(filtered);
        return filtered;
    }

    return { get, set, add, update, remove };
}

// Create stores for projects and caseStudies
const projectsStore = createListStore<Project>('projects', p => p.title);
const caseStudiesStore = createListStore<CaseStudy>('caseStudies', cs => cs.slug);
const mediaStore = createListStore<Media>('media', m => m.id);

export class RedisStore {
    // Projects
    static async getProjects(): Promise<Project[]> {
        return projectsStore.get();
    }

    static async setProjects(projects: Project[]): Promise<void> {
        return projectsStore.set(projects);
    }

    static async addProject(project: Project): Promise<Project[]> {
        return projectsStore.add(project);
    }

    static async updateProject(title: string, updatedProject: Project): Promise<Project[]> {
        return projectsStore.update(title, updatedProject);
    }

    static async deleteProject(title: string): Promise<Project[]> {
        return projectsStore.remove(title);
    }

    // Case studies
    static async getCaseStudies(): Promise<CaseStudy[]> {
        return caseStudiesStore.get();
    }

    static async setCaseStudies(caseStudies: CaseStudy[]): Promise<void> {
        return caseStudiesStore.set(caseStudies);
    }

    static async addCaseStudy(caseStudy: CaseStudy): Promise<CaseStudy[]> {
        return caseStudiesStore.add(caseStudy);
    }

    static async updateCaseStudy(slug: string, updated: CaseStudy): Promise<CaseStudy[]> {
        return caseStudiesStore.update(slug, updated);
    }

    static async deleteCaseStudy(slug: string): Promise<CaseStudy[]> {
        return caseStudiesStore.remove(slug);
    }

    // Media
    static async getMedia(): Promise<Media[]> {
        return mediaStore.get();
    }

    static async setMedia(media: Media[]): Promise<void> {
        return mediaStore.set(media);
    }

    static async addMedia(item: Media): Promise<Media[]> {
        return mediaStore.add(item);
    }

    static async updateMedia(id: string, updated: Media): Promise<Media[]> {
        return mediaStore.update(id, updated);
    }

    static async deleteMedia(id: string): Promise<Media[]> {
        return mediaStore.remove(id);
    }

    // --- Session management ---
    /**
     * Store an admin session token mapping to the ADMIN_TOKEN value.
     * Uses a Redis key `session:<token>` with EX TTL in seconds.
     */
    static async setAdminSession(sessionToken: string, adminToken: string, ttlSeconds = 3600): Promise<void> {
        const client = getRedisClient();
        await client.set(`session:${sessionToken}`, adminToken, 'EX', ttlSeconds);
    }

    /**
     * Get admin token stored for a session token. Returns string or null.
     */
    static async getAdminSession(sessionToken: string): Promise<string | null> {
        const client = getRedisClient();
        const v = await client.get(`session:${sessionToken}`);
        return v;
    }

    /**
     * Delete an admin session token.
     */
    static async deleteAdminSession(sessionToken: string): Promise<void> {
        const client = getRedisClient();
        await client.del(`session:${sessionToken}`);
    }
}

