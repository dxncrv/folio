import Redis from 'ioredis';
import type { Project } from './types';
import { env } from '$env/dynamic/private';

// Check if Redis is properly configured
const isRedisConfigured = () => {
	return env.REDIS_URL && 
		   env.REDIS_URL !== 'your_redis_url_here';
};

// Create Redis client
let redisClient: Redis | null = null;

const getRedisClient = () => {
	if (!redisClient && isRedisConfigured()) {
		redisClient = new Redis(env.REDIS_URL);
		
		redisClient.on('error', (error) => {
			console.error('Redis connection error:', error);
		});
		
		redisClient.on('connect', () => {
			console.log('Connected to Redis');
		});
	}
	return redisClient;
};

export class RedisStore {
	private static readonly PROJECTS_KEY = 'projects';

	/**
	 * Get all projects from Redis store
	 */
	static async getProjects(): Promise<Project[]> {
		const client = getRedisClient();
		if (!client) {
			throw new Error('Redis is not configured. Set REDIS_URL environment variable.');
		}
		const data = await client.get(this.PROJECTS_KEY);
		if (!data) {
			return [];
		}
		const projects = JSON.parse(data) as Project[];
		return projects;
	}

		/**
		 * Set all projects in Redis store
		 */
		static async setProjects(projects: Project[]): Promise<void> {
			const client = getRedisClient();
			if (!client) {
				throw new Error('Redis is not configured. Set REDIS_URL environment variable.');
			}
			try {
				await client.set(this.PROJECTS_KEY, JSON.stringify(projects));
			} catch (error) {
				console.error('Error setting projects in Redis:', error);
				throw error;
			}
		}

		/**
		 * Add a new project
		 */
		static async addProject(project: Project): Promise<Project[]> {
			const projects = await this.getProjects();
			projects.push(project);
			await this.setProjects(projects);
			return projects;
		}

		/**
		 * Update a project by title (using title as unique identifier)
		 */
		static async updateProject(title: string, updatedProject: Project): Promise<Project[]> {
			const projects = await this.getProjects();
			const index = projects.findIndex(p => p.title === title);
			if (index === -1) {
				throw new Error(`Project with title "${title}" not found`);
			}
			projects[index] = updatedProject;
			await this.setProjects(projects);
			return projects;
		}

		/**
		 * Delete a project by title
		 */
		static async deleteProject(title: string): Promise<Project[]> {
			const projects = await this.getProjects();
			const filtered = projects.filter(p => p.title !== title);
			if (filtered.length === projects.length) {
				throw new Error(`Project with title "${title}" not found`);
			}
			await this.setProjects(filtered);
			return filtered;
		}

		/**
		 * Initialize Redis store with data from projects.json (migration helper)
		 */
		static async initializeFromJson(jsonData: Project[]): Promise<void> {
			const client = getRedisClient();
			if (!client) {
				throw new Error('Redis is not configured. Set REDIS_URL environment variable.');
			}
			try {
				const existingProjects = await this.getProjects();
				if (existingProjects.length === 0) {
					await this.setProjects(jsonData);
					console.log('Initialized Redis store with JSON data');
				}
			} catch (error) {
				console.error('Error initializing Redis store:', error);
				throw error;
			}
		}

		/**
		 * Close Redis connection (for cleanup)
		 */
		static async disconnect(): Promise<void> {
			if (redisClient) {
				await redisClient.quit();
				redisClient = null;
			}
		}
}
