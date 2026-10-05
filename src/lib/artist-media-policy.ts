import { AppError } from "./errors";

export const MAX_ARTIST_VIDEOS = 10;
export const MAX_ARTIST_PHOTOS = 10;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 20_000_000;
export const storageQuotaBytes = (tier: string) => (tier === "PRO" ? 5 * 1024 : 500) * 1024 * 1024;

export function getYouTubeVideoId(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/")[1];
    else if (["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split("/")[2];
    }
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export type ArtistVideoInput = { youtubeUrl: string; videoTitle?: string };
export function normalizeArtistVideos(input: Array<ArtistVideoInput | string>) {
  if (!Array.isArray(input) || input.length > MAX_ARTIST_VIDEOS) throw new AppError("VIDEO_LIMIT", "Add up to 10 original YouTube videos.", 400);
  const seen = new Set<string>();
  return input.map((value, index) => {
    const video = typeof value === "string" ? { youtubeUrl: value } : value;
    if (!video || typeof video.youtubeUrl !== "string") throw new AppError("INVALID_VIDEO", "Enter a valid YouTube link.", 400);
    const id = getYouTubeVideoId(video.youtubeUrl);
    if (!id || seen.has(id)) throw new AppError("INVALID_VIDEO", "Use valid, distinct YouTube music links.", 400);
    seen.add(id);
    if (video.videoTitle !== undefined && (typeof video.videoTitle !== "string" || video.videoTitle.length > 255)) throw new AppError("INVALID_VIDEO", "Video title is too long.", 400);
    return { youtubeUrl: `https://www.youtube.com/watch?v=${id}`, videoTitle: video.videoTitle?.trim() || `Official Video ${index + 1}`, orderIndex: index + 1 };
  });
}
