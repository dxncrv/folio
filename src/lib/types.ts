export interface Project {
	tags: string[];
	title: string;
	image: string;
	link: string;
	git: string;
	yt?: string;
	awards?: string[];
    desc: { [key: string]: string | undefined };
    tech: { [key: string]: string[] | undefined };
	study?: { [key: string]: string };
}

export interface CaseStudy {
    slug: string;
    content: string;
}

export interface Facet {
    name: string;
    bool: boolean;
}

export interface Media {
    id: string; // filename or relative path
    type: 'image' | 'video';
    path: string; // relative to static
    alt?: string;
    caption?: string;
    tags?: string[];
}

export interface TalkMessage {
    id: string;
    username: string;
    text: string;
    timestamp: number;
}

export interface TalkSettings {
    pollingMode: 'sync' | 'async';
}