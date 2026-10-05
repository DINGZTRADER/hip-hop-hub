import { createHmac, timingSafeEqual } from "node:crypto";
export const PLAY_WINDOW_MS = 30 * 60 * 1000;
export const qualifyingPlaySeconds = (duration: number) => Math.min(30, Math.max(1, duration / 2));
export function createPlayTicket(userId: string, trackId: string, issuedAt: number, secret: string) {
  const data = Buffer.from(JSON.stringify({ userId, trackId, issuedAt })).toString("base64url");
  return data + "." + createHmac("sha256", secret).update("track-play:" + data).digest("base64url");
}
export function verifyPlayTicket(ticket: string, userId: string, trackId: string, now: number, seconds: number, secret: string) {
  try {
    const [data, signature, extra] = ticket.split(".");
    if (!data || !signature || extra || ticket.length > 2048) return false;
    const expected = createHmac("sha256", secret).update("track-play:" + data).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    const elapsed = now - payload.issuedAt;
    return payload.userId === userId && payload.trackId === trackId && Number.isSafeInteger(payload.issuedAt) && elapsed >= seconds * 1000 && elapsed < PLAY_WINDOW_MS;
  } catch { return false; }
}
