// Small server-side helpers: HTML sanitizer (lightweight) and in-memory rate limiter per IP.
// We avoid adding external deps to keep patch minimal.

// Basic sanitizer: escape angle brackets and attributes that could trigger scripts.
export function sanitizeMarkdownForStorage(markdown: string): string {
    // Very small sanitizer: escape < and > to prevent raw HTML injection.
    // This keeps markdown as-is but neutralizes any raw HTML the author included.
    return markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Simple in-memory rate limiter per IP. This is fine for single-instance dev/staging.
type RateEntry = { count: number; firstSeen: number };
const RATE_MAP = new Map<string, RateEntry>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 30; // 30 requests per minute per IP

export function isRateLimited(ip: string): boolean {
    if (!ip) return true;
    const now = Date.now();
    const entry = RATE_MAP.get(ip);
    if (!entry) {
        RATE_MAP.set(ip, { count: 1, firstSeen: now });
        return false;
    }

    if (now - entry.firstSeen > WINDOW_MS) {
        // reset
        entry.count = 1;
        entry.firstSeen = now;
        RATE_MAP.set(ip, entry);
        return false;
    }

    entry.count += 1;
    RATE_MAP.set(ip, entry);
    return entry.count > MAX_PER_WINDOW;
}

export function getClientIPFromRequest(request: Request): string {
    const headers = request.headers;
    const xff = headers.get('x-forwarded-for') ?? '';
    const xrip = headers.get('x-real-ip') ?? '';
    return (xff.split(',')[0].trim() || xrip.trim() || '').trim();
}
