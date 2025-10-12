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

// Create stores with folio: namespace
const projectsStore = createListStore<Project>('folio:projects', p => p.title);
const studiesStore = createListStore<CaseStudy>('folio:studies', cs => cs.slug);
const mediaStore = createListStore<Media>('folio:media', m => m.id);

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

    // Case studies (renamed to "studies")
    static async getCaseStudies(): Promise<CaseStudy[]> {
        return studiesStore.get();
    }

    static async setCaseStudies(caseStudies: CaseStudy[]): Promise<void> {
        return studiesStore.set(caseStudies);
    }

    static async addCaseStudy(caseStudy: CaseStudy): Promise<CaseStudy[]> {
        return studiesStore.add(caseStudy);
    }

    static async updateCaseStudy(slug: string, updated: CaseStudy): Promise<CaseStudy[]> {
        return studiesStore.update(slug, updated);
    }

    static async deleteCaseStudy(slug: string): Promise<CaseStudy[]> {
        return studiesStore.remove(slug);
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
     * Uses a Redis key `admin:session:<token>` with EX TTL in seconds.
     * Only one session should exist at a time - old sessions are auto-expired.
     */
    static async setAdminSession(sessionToken: string, adminToken: string, ttlSeconds = 3600): Promise<void> {
        const client = getRedisClient();
        await client.set(`admin:session:${sessionToken}`, adminToken, 'EX', ttlSeconds);
    }

    /**
     * Get admin token stored for a session token. Returns string or null.
     */
    static async getAdminSession(sessionToken: string): Promise<string | null> {
        const client = getRedisClient();
        const v = await client.get(`admin:session:${sessionToken}`);
        return v;
    }

    /**
     * Delete an admin session token.
     */
    static async deleteAdminSession(sessionToken: string): Promise<void> {
        const client = getRedisClient();
        await client.del(`admin:session:${sessionToken}`);
    }
}

// --- Redis Inspector for housekeeping and monitoring ---

/**
 * Redis Key Structure Documentation:
 * 
 * FOLIO NAMESPACE (persistent data):
 * - folio:projects: Array of Project objects
 * - folio:studies: Array of CaseStudy objects (renamed from caseStudies)
 * - folio:media: Array of Media objects
 * 
 * TALK NAMESPACE (persistent data):
 * - talk:messages: List of TalkMessage objects
 * - talk:settings: TalkSettings object
 * 
 * ADMIN NAMESPACE (ephemeral data with TTL):
 * - admin:session:<token>: Admin session tokens (TTL: 3600s)
 *   Stores mapping of session cookie to ADMIN_TOKEN for authentication
 *   Only one active session per admin at a time (old sessions expire naturally)
 *   Deleted explicitly on logout
 */

export interface RedisKeyInfo {
    key: string;
    type: string;
    ttl: number;
    size?: number;
}

export interface RedisStats {
    totalKeys: number;
    memoryUsed: string;
    memoryUsedBytes: number;
    connectedClients: number;
    version: string;
    uptime: number;
}

export class RedisInspector {
    /**
     * Scan all keys with optional pattern matching
     * Uses scanStream from ioredis for efficient key traversal
     */
    static async scanKeys(pattern = '*', limit = 100): Promise<string[]> {
        const client = getRedisClient();
        const keys: string[] = [];
        
        return new Promise((resolve, reject) => {
            const stream = client.scanStream({
                match: pattern,
                count: 100
            });
            
            let streamEnded = false;
            
            stream.on('data', (resultKeys: string[]) => {
                if (streamEnded) return;
                
                for (const key of resultKeys) {
                    if (!keys.includes(key)) {
                        keys.push(key);
                    }
                }
                
                if (keys.length >= limit) {
                    streamEnded = true;
                    stream.pause();
                    stream.destroy();
                    resolve(keys.slice(0, limit));
                }
            });
            
            stream.on('end', () => {
                if (!streamEnded) {
                    resolve(keys);
                }
            });
            
            stream.on('error', (err) => {
                console.error('Redis scan error:', err);
                reject(err);
            });
        });
    }

    /**
     * Get detailed information about a specific key
     */
    static async getKeyInfo(key: string): Promise<RedisKeyInfo | null> {
        const client = getRedisClient();
        
        try {
            const [type, ttl] = await Promise.all([
                client.type(key),
                client.ttl(key)
            ]);
            
            if (type === 'none') return null;
            
            let size: number | undefined;
            
            // Get size based on type
            switch (type) {
                case 'string':
                    const strVal = await client.get(key);
                    size = strVal ? Buffer.byteLength(strVal, 'utf8') : 0;
                    break;
                case 'list':
                    size = await client.llen(key);
                    break;
                case 'set':
                    size = await client.scard(key);
                    break;
                case 'zset':
                    size = await client.zcard(key);
                    break;
                case 'hash':
                    size = await client.hlen(key);
                    break;
            }
            
            return { key, type, ttl, size };
        } catch (error) {
            console.error(`Error getting info for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Get Redis server statistics and memory info
     */
    static async getStats(): Promise<RedisStats> {
        const client = getRedisClient();
        
        const info = await client.info();
        const dbsize = await client.dbsize();
        
        // Parse info string
        const lines = info.split('\r\n');
        const stats: Record<string, string> = {};
        
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                stats[key.trim()] = value.trim();
            }
        }
        
        return {
            totalKeys: dbsize,
            memoryUsed: stats['used_memory_human'] || '0B',
            memoryUsedBytes: parseInt(stats['used_memory'] || '0'),
            connectedClients: parseInt(stats['connected_clients'] || '0'),
            version: stats['redis_version'] || 'unknown',
            uptime: parseInt(stats['uptime_in_seconds'] || '0')
        };
    }

    /**
     * Delete a key from Redis
     */
    static async deleteKey(key: string): Promise<boolean> {
        const client = getRedisClient();
        const result = await client.del(key);
        return result > 0;
    }

    /**
     * Get value of a key (for inspection)
     */
    static async getValue(key: string): Promise<string | null> {
        const client = getRedisClient();
        const type = await client.type(key);
        
        switch (type) {
            case 'string':
                return await client.get(key);
            case 'list':
                const list = await client.lrange(key, 0, -1);
                return JSON.stringify(list);
            case 'set':
                const set = await client.smembers(key);
                return JSON.stringify(set);
            case 'zset':
                const zset = await client.zrange(key, 0, -1, 'WITHSCORES');
                return JSON.stringify(zset);
            case 'hash':
                const hash = await client.hgetall(key);
                return JSON.stringify(hash);
            default:
                return null;
        }
    }

}

