/**
 * DEPRECATED: One-time migration endpoint (no longer needed)
 * 
 * Auto-migration is now built into MessageService.getAll() method.
 * This endpoint is kept as reference only and returns 404.
 * 
 * If you need to manually migrate messages in the future, uncomment 
 * the migrateFromList() method in message-service.server.ts and use it.
 * 
 * DELETE THIS FILE if not needed for backward compatibility.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	return json(
		{ 
			error: 'Migration endpoint is deprecated. Auto-migration happens on first getAll() call.',
			message: 'See message-service.server.ts for migration code if needed.'
		},
		{ status: 404 }
	);
};

// OLD CODE (kept for reference - delete if no longer needed)
// ============================================================================
// 
// import { MessageService } from '$lib/server';
// import { getRedisClient } from '$lib/server/redis.server';
// 
// const handleMigrate = async () => {
//   try {
//     const client = getRedisClient();
//     const service = new MessageService(client);
//     
//     // Uncomment in message-service.server.ts first!
//     // const count = await service.migrateFromList('folio:talk:messages');
//     
//     return json({ 
//       success: true, 
//       migrated: count,
//       message: count > 0 ? `Migrated ${count} messages` : 'No messages to migrate or already migrated'
//     });
//   } catch (error) {
//     const message = error instanceof Error ? error.message : 'Migration failed';
//     return json({ error: message }, { status: 500 });
//   }
// };

