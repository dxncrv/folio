import { getRedisClient } from './redis.server';
import type { TalkMessage, TalkSession } from '$lib/types';

const MESSAGES_KEY = 'folio:talk:messages';
const SESSIONS_KEY = 'folio:talk:sessions';

/**
 * Sanitize HTML to prevent XSS injection
 * Escapes <, >, &, ", ' characters
 */
export function sanitizeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Generate a unique session ID from username and IP
 */
function getSessionId(username: string, ip: string): string {
    return `${username.toLowerCase()}:${ip}`;
}

/**
 * Create or update a session in Redis
 */
export async function createSession(username: string, ip: string): Promise<TalkSession> {
    const client = getRedisClient();
    const sessionId = getSessionId(username, ip);
    const now = Date.now();
    
    const session: TalkSession = {
        username: username.trim(),
        ip,
        createdAt: now,
        lastActive: now
    };
    
    console.log('[talk.server] Creating session:', { sessionId, username: session.username, ip });
    
    // Store session with key folio:talk:sessions (hash field = sessionId)
    await client.hset(SESSIONS_KEY, sessionId, JSON.stringify(session));
    
    console.log('[talk.server] Session stored in Redis');
    
    return session;
}

/**
 * Get a session from Redis
 */
export async function getSession(username: string, ip: string): Promise<TalkSession | null> {
    const client = getRedisClient();
    const sessionId = getSessionId(username, ip);
    
    console.log('[talk.server] Looking up session:', { sessionId, username, ip });
    
    const data = await client.hget(SESSIONS_KEY, sessionId);
    
    if (!data) {
        console.log('[talk.server] Session not found for:', sessionId);
        return null;
    }
    
    console.log('[talk.server] Session found:', sessionId);
    
    return JSON.parse(data) as TalkSession;
}

/**
 * Update session last active timestamp
 */
export async function updateSessionActivity(username: string, ip: string): Promise<void> {
    const session = await getSession(username, ip);
    if (session) {
        session.lastActive = Date.now();
        const client = getRedisClient();
        const sessionId = getSessionId(username, ip);
        await client.hset(SESSIONS_KEY, sessionId, JSON.stringify(session));
    }
}

/**
 * Get all active sessions (for admin)
 */
export async function getAllSessions(): Promise<TalkSession[]> {
    const client = getRedisClient();
    const data = await client.hgetall(SESSIONS_KEY);
    
    if (!data || Object.keys(data).length === 0) return [];
    
    return Object.values(data).map(str => JSON.parse(str) as TalkSession);
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
 * Add a message to Redis (with sanitization)
 */
export async function addMessage(username: string, text: string): Promise<TalkMessage> {
    const client = getRedisClient();
    
    // Sanitize text to prevent XSS
    const sanitizedText = sanitizeHtml(text.trim());
    
    const message: TalkMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        username,
        text: sanitizedText,
        timestamp: Date.now()
    };
    
    // Push to list
    await client.rpush(MESSAGES_KEY, JSON.stringify(message));
    
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
 * Talk sessions are stored in Redis hash: folio:talk:sessions
 * Each session is keyed by username:ip and contains username, ip, timestamps
 * Open access: any username allowed; XSS prevention via sanitization
 */
