export interface Project {
	id?: string;
	tags: string[];
	title: string;
	slug?: string; // Optional slug for URL routing, defaults to slugified title
	order?: number; // Manual sort order
	image?: string; // PocketBase file field - stores filename
	link: string;
	git: string;
	yt?: string;
	awards?: string[];
	desc: { [key: string]: string | undefined };
	tech: { [key: string]: string[] | undefined };
	study?: string; // Expanded study content from PocketBase relation
	collectionId?: string; // PB metadata
	collectionName?: string;
}

export interface Study {
	id?: string;
	project: string; // Relation to project ID
	title: string;
	slug?: string;
	content: string; // Markdown content
	order?: number;
	collectionId?: string;
	collectionName?: string;
}

export interface TalkMessage {
    id: string;
    username: string;
    text: string;
    timestamp: number;
    status?: 'pending' | 'sent' | 'failed'; // Optional for optimistic UI
    expiresAt?: number; // Unix timestamp when message should disappear (0 = never)
}