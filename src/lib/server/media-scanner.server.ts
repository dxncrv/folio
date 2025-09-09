import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { RedisStore } from './redis.server';
import type { Media } from '$lib/types';

const STATIC_DIR = 'static';
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const VIDEO_EXTS = ['.mp4', '.webm', '.avi', '.mov'];

function getMediaType(ext: string): 'image' | 'video' | null {
    if (IMAGE_EXTS.includes(ext.toLowerCase())) return 'image';
    if (VIDEO_EXTS.includes(ext.toLowerCase())) return 'video';
    return null;
}

async function scanDirectory(dir: string, basePath = ''): Promise<Media[]> {
    const media: Media[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = join(basePath, entry.name);

        if (entry.isDirectory()) {
            // Recurse into subdirectories
            const subMedia = await scanDirectory(fullPath, relativePath);
            media.push(...subMedia);
        } else if (entry.isFile()) {
            const ext = extname(entry.name);
            const type = getMediaType(ext);
            if (type) {
                const id = relativePath.replace(/\\/g, '/'); // Normalize to forward slashes
                media.push({
                    id,
                    type,
                    path: relativePath,
                    alt: '',
                    caption: '',
                    tags: []
                });
            }
        }
    }

    return media;
}

export async function scanMedia(): Promise<Media[]> {
    try {
        const currentMedia = await scanDirectory(STATIC_DIR);
        
        // Get existing media from Redis
        const existing = await RedisStore.getMedia();
        const existingMap = new Map(existing.map(m => [m.id, m]));
        
        // Find media that exist in Redis but not in filesystem (to be removed)
        const currentIds = new Set(currentMedia.map(m => m.id));
        const toRemove = existing.filter(m => !currentIds.has(m.id));
        
        // Remove orphaned media from Redis
        if (toRemove.length > 0) {
            console.log(`Removing ${toRemove.length} orphaned media entries:`, toRemove.map(m => m.id));
            for (const media of toRemove) {
                await RedisStore.deleteMedia(media.id);
            }
        }
        
        // Merge current filesystem media with existing metadata
        const merged = currentMedia.map(m => {
            const existingItem = existingMap.get(m.id);
            return existingItem ? { ...m, ...existingItem } : m;
        });

        await RedisStore.setMedia(merged);
        return merged;
    } catch (error) {
        console.error('Error scanning media:', error);
        throw error;
    }
}
