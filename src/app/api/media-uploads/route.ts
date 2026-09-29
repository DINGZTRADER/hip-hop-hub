import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { finalizeMediaUpload, reserveMediaUpload } from "@/lib/media-uploads";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_STORE_ID)
      throw new AppError("MEDIA_UNAVAILABLE", "MP3 storage is not configured.", 503);
    const body = await request.json() as HandleUploadPresignedBody;
    const response = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        const session = await getSession();
        if (!session) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
        let size: number;
        try { size = JSON.parse(clientPayload || "").size; }
        catch { throw new AppError("INVALID_UPLOAD", "Upload size is required.", 400); }
        const upload = await reserveMediaUpload(session.userId, pathname, size);
        const validUntil = Date.now() + 60 * 60 * 1000;
        const allowedContentTypes = ["audio/mpeg", "audio/mp3"];
        return {
          token: await issueSignedToken({ pathname, operations: ["put"],
            allowedContentTypes, maximumSizeInBytes: size, validUntil }),
          urlOptions: { allowedContentTypes, maximumSizeInBytes: size, validUntil,
            allowOverwrite: false, addRandomSuffix: false,
            tokenPayload: JSON.stringify({ userId: session.userId, id: upload.id }) },
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || "") as { userId: string; id: string };
        await finalizeMediaUpload(payload.userId, payload.id, blob.url);
      },
    });
    return NextResponse.json(response);
  } catch (error) { return handleApiError(error); }
}
