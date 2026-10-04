export const FEATURED_IDS = [
  "Qj84C2r0ahw", "Y2A7g1X8Lks", "Wp3RJEXxS3o", "o66mG8c9yU8",
  "4MqRvrqZ0so", "QMchOEWMTuY", "kRYKFHl3kW4", "wrMBSqGmSn8",
];
export const MAX_SAVED_VIDEOS = 100;

export function youtubeId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (/^\/(shorts|embed)\//.test(url.pathname)) id = url.pathname.split("/")[2];
    } else if (["youtu.be", "www.youtu.be"].includes(host)) id = url.pathname.slice(1);
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function normalizeVideoIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_SAVED_VIDEOS ||
      value.some(id => typeof id !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(id))) return null;
  return [...new Set(value)].filter(id => !FEATURED_IDS.includes(id));
}
