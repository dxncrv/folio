/**
 * Server Utilities Barrel Export
 * 
 * Centralized export point for all server-side utilities.
 * Use this to import server functionality instead of individual files.
 * 
 * @example
 * ```typescript
 * import { withAdmin, RedisStore, isAuthorizedWrite } from '$lib/server';
 * ```
 */

// Redis and storage
export { getRedisClient, RedisStore, RedisInspector } from './redis.server';

// Security and authentication
export { isIPWhitelisted, isAuthorizedWrite } from './security.server';

// API utilities and response helpers
export { respondJson, normalizeHandlerResults, withHandler, withAdmin } from './api-utils.server';

// Media scanning
export { scanMedia } from './media-scanner.server';

// Talk chat utilities
export {
	MESSAGES_KEY,
	MAX_MESSAGE_LENGTH,
	USERNAME_MAX_LENGTH,
	SESSION_MAX_AGE,
	sanitizeHtml,
	validateUsername,
	validateMessage,
	getCookieConfig,
	setSessionCookie,
	clearSessionCookie,
	getAuthUser,
	getMessages,
	addMessage,
	updateMessage,
	deleteMessage
} from './talk.server';

