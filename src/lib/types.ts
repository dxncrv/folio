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

export interface Facet {
    name: string;
    bool: boolean;
}