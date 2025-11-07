import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { withAdmin, RedisInspector } from '$lib/server';

// GET: Scan keys and get stats
export const GET: RequestHandler = withAdmin(async ({ url }) => {
    const action = url.searchParams.get('action') || 'stats';
    const pattern = url.searchParams.get('pattern') || '*';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const key = url.searchParams.get('key');

    switch (action) {
        case 'stats':
            const stats = await RedisInspector.getStats();
            return json(stats);
        
        case 'scan':
            const keys = await RedisInspector.scanKeys(pattern, limit);
            return json({ keys, count: keys.length });
        
        case 'keyInfo':
            if (!key) {
                return json({ error: 'Key parameter required' }, { status: 400 });
            }
            const info = await RedisInspector.getKeyInfo(key);
            if (!info) {
                return json({ error: 'Key not found' }, { status: 404 });
            }
            return json(info);
        
        case 'getValue':
            if (!key) {
                return json({ error: 'Key parameter required' }, { status: 400 });
            }
            const value = await RedisInspector.getValue(key);
            return json({ key, value });
        
        case 'allKeys':
            // Get detailed info for all keys matching pattern
            const allKeys = await RedisInspector.scanKeys(pattern, limit);
            const keysInfo = await Promise.all(
                allKeys.map(k => RedisInspector.getKeyInfo(k))
            );
            return json({ 
                keys: keysInfo.filter(k => k !== null),
                count: keysInfo.length 
            });
        
        default:
            return json({ error: 'Invalid action' }, { status: 400 });
    }
});

// DELETE: Delete keys
export const DELETE: RequestHandler = withAdmin(async ({ url }) => {
    const key = url.searchParams.get('key');

    if (key) {
        // Delete single key
        const success = await RedisInspector.deleteKey(key);
        return json({ deleted: success ? 1 : 0, key });
    } else {
        return json({ error: 'Key parameter required' }, { status: 400 });
    }
});
