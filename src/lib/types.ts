export interface Project {
	tags: string[];
	slug: string;
	title: string;
	image: string;
	link: string;
	git: string;
	yt?: string;
	awards?: string[];
    desc: { [key: string]: string };
    tech: { [key: string]: string[] };
	study?: { [key: string]: string };
}

export interface Facet {
    name: string;
    bool: boolean;
}