import { getRedisClient } from './redis.server';
import type { TalkMessage, TalkSettings } from '$lib/types';

const MESSAGES_KEY = 'talk:messages';
const SETTINGS_KEY = 'talk:settings';
const MESSAGE_TTL = 86400; // 1 day in seconds

// Valid usernames (hardcoded dictionary)
export const VALID_USERS = new Set(['alpha', 'beta', 'charlie', 'delta']);

/**
 * Validate if username is in allowed list
 */
export function isValidUser(username: string): boolean {
    return VALID_USERS.has(username.toLowerCase());
}

/**
 * Get all chat messages from Redis
 */
export async function getMessages(): Promise<TalkMessage[]> {
    try {
        const client = getRedisClient();
        const messages = await client.lrange(MESSAGES_KEY, 0, -1);
        return messages.map(m => JSON.parse(m) as TalkMessage);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

/**
 * Add a message to Redis with TTL
 */
export async function addMessage(username: string, text: string): Promise<TalkMessage> {
    const client = getRedisClient();
    const message: TalkMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        username,
        text,
        timestamp: Date.now()
    };
    
    // Push to list
    await client.rpush(MESSAGES_KEY, JSON.stringify(message));
    
    // Set TTL on the list key (applies to entire list, but we'll manage cleanup)
    await client.expire(MESSAGES_KEY, MESSAGE_TTL);
    
    return message;
}

/**
 * Clear all messages (admin only)
 */
export async function clearMessages(): Promise<void> {
    const client = getRedisClient();
    await client.del(MESSAGES_KEY);
}

/**
 * Get chat settings (polling mode)
 */
export async function getSettings(): Promise<TalkSettings> {
    try {
        const client = getRedisClient();
        const data = await client.get(SETTINGS_KEY);
        if (data) {
            return JSON.parse(data) as TalkSettings;
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
    
    // Default settings
    return { pollingMode: 'sync' };
}

/**
 * Update chat settings (admin only)
 */
export async function updateSettings(settings: TalkSettings): Promise<void> {
    const client = getRedisClient();
    await client.set(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Talk sessions are not stored in Redis - pseudo auth for testing only.
 * Username validation happens via cookie and VALID_USERS check.
 * No need to persist sessions as this is temporary testing infrastructure.
 */
