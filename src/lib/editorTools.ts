// Small singleton helper to insert boilerplate templates into a textarea's value
// Designed for Svelte 5 (runes) usage: functions return the new content and cursor
export type InsertResult = { content: string; cursor: number };

class EditorTools {
  private static instance: EditorTools | null = null;

  static getInstance() {
    if (!EditorTools.instance) EditorTools.instance = new EditorTools();
    return EditorTools.instance;
  }

  private constructor() {
    // singleton
  }

  insertTemplate(template: string, textarea: HTMLTextAreaElement | null, content: string): InsertResult {
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? start;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const newContent = before + template + after;
    const cursor = before.length + template.length;
    return { content: newContent, cursor };
  }

  imagePlaceholder(): string {
    return '![Alt text](/path/to/image.png)';
  }

  videoPlaceholder(): string {
    return '!![Alt text](/path/to/video.mp4)';
  }

  linkPlaceholder(): string {
    return '[Link text](https://example.com)';
  }

  insertImage(textarea: HTMLTextAreaElement | null, content: string): InsertResult {
    return this.insertTemplate(this.imagePlaceholder(), textarea, content);
  }

  insertVideo(textarea: HTMLTextAreaElement | null, content: string): InsertResult {
    return this.insertTemplate(this.videoPlaceholder(), textarea, content);
  }

  insertLink(textarea: HTMLTextAreaElement | null, content: string): InsertResult {
    return this.insertTemplate(this.linkPlaceholder(), textarea, content);
  }
}

export const EditorTool = EditorTools.getInstance();
