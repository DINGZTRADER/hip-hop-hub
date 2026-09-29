import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { finalizeMediaUpload, reserveMediaUpload } from "@/lib/media-uploads";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN)
      throw new AppError("MEDIA_UNAVAILABLE", "MP3 storage is not configured.", 503);
    const body = await request.json() as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getSession();
        if (!session) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
        let size: number;
        try { size = JSON.parse(clientPayload || "").size; }
        catch { throw new AppError("INVALID_UPLOAD", "Upload size is required.", 400); }
        const upload = await reserveMediaUpload(session.userId, pathname, size);
        return { allowedContentTypes: ["audio/mpeg", "audio/mp3"],
          maximumSizeInBytes: size, addRandomSuffix: false,
          tokenPayload: JSON.stringify({ userId: session.userId, id: upload.id }) };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || "") as { userId: string; id: string };
        await finalizeMediaUpload(payload.userId, payload.id, blob.url);
      },
    });
    return NextResponse.json(response);
  } catch (error) { return handleApiError(error); }
}
