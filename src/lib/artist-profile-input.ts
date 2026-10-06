import { AppError } from "./errors";
import { ArtistVideoInput, MAX_ARTIST_PHOTOS, normalizeArtistVideos } from "./artist-media-policy";
import { isUuid } from "./media-upload-policy";

export type ArtistProfileInput = {
  bio?: string | null; phoneForBookings?: string | null; bookingEmail?: string | null; websiteUrl?: string | null;
  portraitImageId?: string | null; galleryImageIds?: string[];
  youtubeVideos?: ArtistVideoInput[]; originalsConfirmed?: boolean;
  bookingRates?: Array<{serviceId:string;priceUgx:number}>;
};
export function validateArtistProfileInput(input: Record<string, unknown>): ArtistProfileInput {
  const output: ArtistProfileInput = {};
  if (Object.hasOwn(input, "bookingRates")) {
    const rates=input.bookingRates;
    if(!Array.isArray(rates)||rates.length>50||rates.some(rate=>!rate||typeof rate.serviceId!=="string"||!isUuid(rate.serviceId)||!Number.isSafeInteger(rate.priceUgx)||rate.priceUgx<1||rate.priceUgx>2147483647)||new Set(rates.map(rate=>rate.serviceId)).size!==rates.length)
      throw new AppError("INVALID_RATE", "Use distinct booking services and whole UGX rates between 1 and 2,147,483,647.",400);
    output.bookingRates=rates.map(rate=>({serviceId:rate.serviceId,priceUgx:rate.priceUgx}));
  }
  for (const key of ["bio", "phoneForBookings", "bookingEmail", "websiteUrl"] as const) {
    if (!Object.hasOwn(input, key)) continue;
    const value = input[key];
    if (value !== null && typeof value !== "string") throw new AppError("INVALID_PROFILE", "Invalid profile field.", 400);
    const text = typeof value === "string" ? value.trim() : "";
    const max = key === "bio" ? 3000 : key === "phoneForBookings" ? 50 : key === "websiteUrl" ? 2048 : 255;
    if (text.length > max) throw new AppError("INVALID_PROFILE", "Profile field is too long.", 400);
    if (key === "bookingEmail" && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new AppError("INVALID_PROFILE", "Enter a valid booking email.", 400);
    if (key === "websiteUrl" && text) {
      try { const url = new URL(text); if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error(); }
      catch { throw new AppError("INVALID_PROFILE", "Website must be a valid http or https URL.", 400); }
    }
    output[key] = text || null;
  }
  if (Object.hasOwn(input, "portraitImageId")) {
    if (input.portraitImageId !== null && (typeof input.portraitImageId !== "string" || !isUuid(input.portraitImageId))) throw new AppError("INVALID_PROFILE", "Invalid portrait.", 400);
    output.portraitImageId = input.portraitImageId as string | null;
  }
  if (Object.hasOwn(input, "galleryImageIds")) {
    const ids = input.galleryImageIds;
    if (!Array.isArray(ids) || ids.length > MAX_ARTIST_PHOTOS || ids.some(id => typeof id !== "string" || !isUuid(id)) || new Set(ids).size !== ids.length) throw new AppError("INVALID_PROFILE", "Choose up to 10 distinct gallery photos.", 400);
    output.galleryImageIds = ids;
  }
  if (Object.hasOwn(input, "youtubeVideos")) {
    if (input.originalsConfirmed !== true && Array.isArray(input.youtubeVideos) && input.youtubeVideos.length) throw new AppError("ORIGINALS_REQUIRED", "Confirm these videos are your original music.", 400);
    output.youtubeVideos = normalizeArtistVideos(input.youtubeVideos as ArtistVideoInput[]);
  }
  return output;
}
