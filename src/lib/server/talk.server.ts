/**
 * Talk API Utilities
 * 
 * Pure functions for chat session management, message handling, and sanitization.
 * Decoupled from request handlers to improve testability and reusability.
 * 
 * Context7: /llmstxt/svelte_dev_kit_llms_txt - Server utilities pattern
 */

import type { Cookies } from '@sveltejs/kit';
import { getRedisClient } from './redis.server';
import type { TalkMessage } from '$lib/types';

// ============================================================================
// Configuration Constants
// ============================================================================

export const MESSAGES_KEY = 'folio:talk:messages';
export const MAX_MESSAGE_LENGTH = 5000;
export const USERNAME_MAX_LENGTH = 50;
export const SESSION_MAX_AGE = 86400 * 30; // 30 days

// ============================================================================
// Sanitization & Validation
// ============================================================================

/**
 * Sanitize HTML to prevent XSS - escapes dangerous characters
 * @pure
 */
export const sanitizeHtml = (text: string): string =>
	text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');

/**
 * Validate and normalize username input
 */
export const validateUsername = (username: unknown): string | null => {
	if (typeof username !== 'string') return null;
	const normalized = username.trim();
	return normalized.length > 0 && normalized.length <= USERNAME_MAX_LENGTH ? normalized : null;
};

/**
 * Validate message text input
 */
export const validateMessage = (text: unknown): string | null => {
	if (typeof text !== 'string') return null;
	const trimmed = text.trim();
	return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH ? trimmed : null;
};

// ============================================================================
// Cookie Management
// ============================================================================

/**
 * Get cookie configuration for talk session
 */
export const getCookieConfig = (maxAge: number = SESSION_MAX_AGE) => ({
	path: '/',
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	maxAge
});

/**
 * Set session cookie with username
 */
export const setSessionCookie = (cookies: Cookies, username: string) =>
	cookies.set('talk_username', username, getCookieConfig());

/**
 * Clear session cookie
 */
export const clearSessionCookie = (cookies: Cookies) =>
	cookies.set('talk_username', '', getCookieConfig(0));

/**
 * Get authenticated username from cookies, or null if not authenticated
 */
export const getAuthUser = (cookies: Cookies): string | null =>
	cookies.get('talk_username') || null;

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Get all chat messages from Redis
 */
export const getMessages = async (): Promise<TalkMessage[]> => {
	try {
		const client = getRedisClient();
		const messages = await client.lrange(MESSAGES_KEY, 0, -1);
		return messages.map((m) => JSON.parse(m) as TalkMessage);
	} catch (error) {
		console.error('[talk] Error fetching messages:', error);
		return [];
	}
};

/**
 * Add message to Redis with sanitization
 */
export const addMessage = async (username: string, text: string): Promise<TalkMessage> => {
	const client = getRedisClient();
	const message: TalkMessage = {
		id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
		username,
		text: sanitizeHtml(text.trim()),
		timestamp: Date.now()
	};
	await client.rpush(MESSAGES_KEY, JSON.stringify(message));
	return message;
};

/**
 * Update a message in Redis (only if user owns it)
 */
export const updateMessage = async (messageId: string, username: string, newText: string): Promise<TalkMessage> => {
	const client = getRedisClient();
	const messages = await getMessages();
	const index = messages.findIndex(m => m.id === messageId);
	
	if (index === -1) {
		throw new Error('Message not found');
	}
	
	if (messages[index].username !== username) {
		throw new Error('Unauthorized: You can only edit your own messages');
	}
	
	const updatedMessage: TalkMessage = {
		...messages[index],
		text: sanitizeHtml(newText.trim()),
		timestamp: messages[index].timestamp // Keep original timestamp
	};
	
	// Update the message in Redis list
	await client.lset(MESSAGES_KEY, index, JSON.stringify(updatedMessage));
	return updatedMessage;
};

/**
 * Delete a message from Redis (only if user owns it)
 */
export const deleteMessage = async (messageId: string, username: string): Promise<void> => {
	const client = getRedisClient();
	const messages = await getMessages();
	const message = messages.find(m => m.id === messageId);
	
	if (!message) {
		throw new Error('Message not found');
	}
	
	if (message.username !== username) {
		throw new Error('Unauthorized: You can only delete your own messages');
	}
	
	// Mark for deletion by setting to a sentinel value, then remove it
	// Redis doesn't support LREM by index, so we use LREM by value
	await client.lrem(MESSAGES_KEY, 1, JSON.stringify(message));
};
