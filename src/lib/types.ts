export interface Project {
	tags: string[];
	title: string;
	slug?: string; // Optional slug for URL routing, defaults to slugified title
	image: string;
	link: string;
	git: string;
	yt?: string;
	awards?: string[];
    desc: { [key: string]: string | undefined };
    tech: { [key: string]: string[] | undefined };
	study?: string; // Markdown content of the case study
}

export interface TalkMessage {
    id: string;
    username: string;
    text: string;
    timestamp: number;
    status?: 'pending' | 'sent' | 'failed'; // Optional for optimistic UI
    expiresAt?: number; // Unix timestamp when message should disappear (0 = never)
}

export interface RedisKeyInfo {
    key: string;
    type: string;
    ttl: number;
    size?: number;
}

export interface RedisStats {
    totalKeys: number;
    memoryUsed: string;
    memoryUsedBytes: number;
    connectedClients: number;
    version: string;
    uptime: number;
}