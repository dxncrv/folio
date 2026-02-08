/**
 * Auto-generated PocketBase types — 2026-02-08T00:33:51.554Z
 * Do not edit manually. Regenerate with: pnpm pb:typegen
 */

import PocketBase, { type RecordService, type RecordModel } from 'pocketbase';

// Base system fields that all records have
interface BaseSystemFields {
	id: string;
	collectionId: string;
	collectionName: string;
	created: string;
	updated: string;
}

export interface _superusersRecord extends BaseSystemFields, RecordModel {
	password: unknown;
	tokenKey: string;
	email: string;
	emailVisibility?: boolean;
	verified?: boolean;
}

export interface StudiesRecord extends BaseSystemFields, RecordModel {
	slug: string;
	title?: string;
	content?: string;
}

export interface ProjectsRecord extends BaseSystemFields, RecordModel {
	order?: number;
	title: string;
	slug: string;
	image?: string[];
	link?: string;
	git?: string;
	yt?: string;
	awards?: unknown;
	tags?: unknown;
	desc?: unknown;
	tech?: unknown;
	studies?: string[];
	published?: boolean;
}

export interface MessagesRecord extends BaseSystemFields, RecordModel {
	username: string;
	text: string;
}

export interface TypedPocketBase extends PocketBase {
	collection(idOrName: '_superusers'): RecordService<_superusersRecord>;
	collection(idOrName: 'studies'): RecordService<StudiesRecord>;
	collection(idOrName: 'projects'): RecordService<ProjectsRecord>;
	collection(idOrName: 'messages'): RecordService<MessagesRecord>;
	collection<T = RecordModel>(idOrName: string): RecordService<T>;
}
