/**
 * Talk API Utilities
 * 
 * Pure functions for chat session management, message handling, and sanitization.
 * Decoupled from request handlers to improve testability and reusability.
 * 
 * Context7: /llmstxt/svelte_dev_kit_llms_txt - Server utilities pattern
 */

import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// ============================================================================
// Configuration Constants
// ============================================================================

export const MAX_MESSAGE_LENGTH = 5000;
export const USERNAME_MAX_LENGTH = 50;
export const SESSION_MAX_AGE = 86400 * 30; // 30 days

// ============================================================================
// Sanitization & Validation
// ============================================================================

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
// NOTE: Message CRUD operations moved to MessageService (ZSET+HASH storage)
// Use MessageService for add/update/delete operations
