import { AppError } from "./errors";

export function validateMasterUrl(value: unknown): string {
  const host = process.env.MEDIA_ORIGIN_HOST;
  if (!host) throw new AppError("MEDIA_UNAVAILABLE", "Private media storage is not configured.", 503);
  if (typeof value !== "string" || value.length > 2048)
    throw new AppError("INVALID_MEDIA", "A private master MP3 URL is required.", 400);
  let url: URL;
  try { url = new URL(value); }
  catch { throw new AppError("INVALID_MEDIA", "Invalid master MP3 URL.", 400); }
  if (url.protocol !== "https:" || url.hostname !== host || url.username || url.password ||
    url.search || url.hash)
    throw new AppError("INVALID_MEDIA", "Master MP3 must be stored on the configured private media origin.", 400);
  return url.toString();
}

export function validatePreviewUrl(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048)
    throw new AppError("INVALID_MEDIA", "A preview MP3 URL is required.", 400);
  let url: URL;
  try { url = new URL(value); }
  catch { throw new AppError("INVALID_MEDIA", "Invalid preview MP3 URL.", 400); }
  if (url.protocol !== "https:" || url.username || url.password)
    throw new AppError("INVALID_MEDIA", "Preview MP3 URL must use HTTPS.", 400);
  return url.toString();
}
