export type MediaKind = "master" | "preview";
export const MAX_MASTER_BYTES = 50 * 1024 * 1024;
export const MAX_PREVIEW_BYTES = 3 * 1024 * 1024;
export const FREE_STORAGE_BYTES = 500 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean { return UUID.test(value); }

export function uploadPath(userId: string, kind: MediaKind, id: string): string {
  if (!isUuid(userId) || !isUuid(id)) throw new Error("Invalid upload ID.");
  return "music/" + userId + "/" + kind + "/" + id + ".mp3";
}

export function parseUploadPath(pathname: string, userId: string): { id: string; kind: MediaKind } | null {
  const match = /^music\/([0-9a-f-]+)\/(master|preview)\/([0-9a-f-]+)\.mp3$/i.exec(pathname);
  if (!match || match[1] !== userId || !isUuid(match[3])) return null;
  const kind = match[2] as MediaKind;
  if (uploadPath(userId, kind, match[3]) !== pathname) return null;
  return { id: match[3], kind };
}

export function validUploadSize(kind: MediaKind, bytes: number): boolean {
  return Number.isSafeInteger(bytes) && bytes >= 1024 &&
    bytes <= (kind === "master" ? MAX_MASTER_BYTES : MAX_PREVIEW_BYTES);
}
