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
export { getRedisClient, getRedisSubscriber, RedisStore, RedisInspector } from './redis.server';

// Security and authentication
export { isIPWhitelisted, isAuthorizedWrite } from './security.server';

// API utilities and response helpers
export { respondJson, normalizeHandlerResults, withHandler, withAdmin } from './api-utils.server';

// Talk chat utilities
export {
	MAX_MESSAGE_LENGTH,
	USERNAME_MAX_LENGTH,
	SESSION_MAX_AGE,
	validateUsername,
	validateMessage,
	getCookieConfig,
	setSessionCookie,
	clearSessionCookie,
	getAuthUser
} from './talk.server';

// Message service with versioning and pub/sub
export { MessageService, CHANNEL, type MessageEvent } from './message-service.server';

// Shared pub/sub manager
export { pubsubManager } from './pubsub.server';

