// Minimal editor helpers: single insert function + short helpers
export type InsertResult = { content: string; cursor: number };

const placeholders = {
  image: '![Alt text](/path/to/image.png)',
  video: '!![Alt text](/path/to/video.mp4)',
  link: '[Link text](https://example.com)'
} as const;

export function insert(template: string, textarea: HTMLTextAreaElement | null, content: string): InsertResult {
  const s = textarea?.selectionStart ?? content.length;
  const e = textarea?.selectionEnd ?? s;
  const before = content.slice(0, s);
  const after = content.slice(e);
  const newContent = before + template + after;
  return { content: newContent, cursor: before.length + template.length };
}

export const insertImage = (t: HTMLTextAreaElement | null, c: string) => insert(placeholders.image, t, c);
export const insertVideo = (t: HTMLTextAreaElement | null, c: string) => insert(placeholders.video, t, c);
export const insertLink = (t: HTMLTextAreaElement | null, c: string) => insert(placeholders.link, t, c);
export const insertText = (t: HTMLTextAreaElement | null, c: string, text: string) => insert(text, t, c);