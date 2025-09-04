import Redis from 'ioredis';
import type { Project } from '$lib/types';
import { env } from '$env/dynamic/private';

let redisClient: Redis | null = null;

const getRedisClient = () => {
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

const getProjects = async (): Promise<Project[]> => {
    const data = await getRedisClient().get('projects');
    return data ? JSON.parse(data) : [];
};

const setProjects = async (projects: Project[]): Promise<void> => {
    await getRedisClient().set('projects', JSON.stringify(projects));
};

export class RedisStore {
    static async getProjects(): Promise<Project[]> {
        return getProjects();
    }

    static async setProjects(projects: Project[]): Promise<void> {
        return setProjects(projects);
    }

    static async addProject(project: Project): Promise<Project[]> {
        const projects = await getProjects();
        projects.push(project);
        await setProjects(projects);
        return projects;
    }

    static async updateProject(title: string, updatedProject: Project): Promise<Project[]> {
        const projects = await getProjects();
        const index = projects.findIndex(p => p.title === title);
        if (index === -1) throw new Error(`Project with title "${title}" not found`);
        projects[index] = updatedProject;
        await setProjects(projects);
        return projects;
    }

    static async deleteProject(title: string): Promise<Project[]> {
        const projects = await getProjects();
        const filtered = projects.filter(p => p.title !== title);
        if (filtered.length === projects.length) throw new Error(`Project with title "${title}" not found`);
        await setProjects(filtered);
        return filtered;
    }
}

