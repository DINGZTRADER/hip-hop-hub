import { AppError } from "./errors";

export function requireSameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new AppError("FORBIDDEN", "Open this form on Hip Hop Hub before saving.", 403);
}
export async function readBoundedBody(request: Request, maximum: number): Promise<Uint8Array> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > maximum) throw new AppError("BODY_SIZE", "Uploaded request is too large.", 413);
  if (!request.body) throw new AppError("INVALID_UPLOAD", "Choose a file first.", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maximum) { await reader.cancel(); throw new AppError("BODY_SIZE", "Uploaded request is too large.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return body;
}
