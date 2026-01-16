/**
* This file provides type definitions for your PocketBase collections.
* These types are manually defined based on your application's usage.
* In the future, you can generate this using `pocketbase-typegen`.
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

export interface UserRecord extends BaseSystemFields, RecordModel {
    email?: string;
    name?: string;
    avatar?: string;
    verified?: boolean;
}

export interface ProjectRecord extends BaseSystemFields, RecordModel {
    title: string;
    slug: string;
    image: string;     // file
    link: string;
    git: string;
    yt?: string;
    awards?: string[]; // JSON field
    tags: string[];    // JSON field
    desc: Record<string, string>; // JSON field
    tech: Record<string, string[]>; // JSON field
    studies?: string | string[]; // Relation to 'studies'
    order?: number;
    published?: boolean;
}

export interface StudyRecord extends BaseSystemFields, RecordModel {
    slug: string;
    content: string; // Markdown
    project?: string; // Relation to 'projects'
    title?: string;
}

export interface MessageRecord extends BaseSystemFields, RecordModel {
    username: string;
    text: string;
    status?: string;
}

export interface TypedPocketBase extends PocketBase {
    collection(idOrName: 'users'): RecordService<UserRecord>;
    collection(idOrName: 'projects'): RecordService<ProjectRecord>;
    collection(idOrName: 'studies'): RecordService<StudyRecord>;
    collection(idOrName: 'messages'): RecordService<MessageRecord>;
    collection<T = RecordModel>(idOrName: string): RecordService<T>;
}
