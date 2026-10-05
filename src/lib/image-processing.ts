import sharp from "sharp";
import { MAX_IMAGE_BYTES, MAX_IMAGE_PIXELS } from "./artist-media-policy";
import { AppError } from "./errors";

export type ImageCrop = { left: number; top: number; size: number };
export async function optimizeArtistImage(data: Buffer, purpose: "portrait" | "gallery", crop?: ImageCrop) {
  if (!data.length || data.length > MAX_IMAGE_BYTES) throw new AppError("IMAGE_SIZE", "Choose an image up to 2 MB.", 400);
  try {
    const metadata = await sharp(data, { limitInputPixels: MAX_IMAGE_PIXELS, animated: true }).metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) !== 1 || !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS)
      throw new Error("Invalid raster image");
    // Decode and auto-orient before cropping so the editor and decoder share dimensions.
    const oriented = await sharp(data, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate().toBuffer();
    let pipeline = sharp(oriented, { limitInputPixels: MAX_IMAGE_PIXELS });
    if (crop) {
      const dimensions = await pipeline.metadata();
      if (purpose !== "portrait" || ![crop.left, crop.top, crop.size].every(Number.isSafeInteger) || crop.left < 0 || crop.top < 0 || crop.size < 1 || crop.left + crop.size > dimensions.width! || crop.top + crop.size > dimensions.height!) throw new Error("Invalid crop");
      pipeline = pipeline.extract({ left: crop.left, top: crop.top, width: crop.size, height: crop.size });
    }
    pipeline = purpose === "portrait" ? pipeline.resize(512, 512, { fit: "cover", withoutEnlargement: true }) : pipeline.resize(1600, 1600, { fit: "inside", withoutEnlargement: true });
    const result = await pipeline.webp({ quality: 82, effort: 4 }).toBuffer({ resolveWithObject: true });
    if (result.data.length > MAX_IMAGE_BYTES) throw new Error("Optimized image too large");
    return { data: result.data, width: result.info.width, height: result.info.height };
  } catch { throw new AppError("INVALID_IMAGE", "Use a still JPG, PNG or WebP image up to 20 megapixels with a valid crop.", 400); }
}
