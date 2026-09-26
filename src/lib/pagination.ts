export interface CursorPayload {
  id: string;
  createdAt: string;
}

export function encodeCursor(payload: CursorPayload): string {
  const jsonStr = JSON.stringify(payload);
  return Buffer.from(jsonStr, "utf-8").toString("base64url");
}

export function decodeCursor(cursor?: string | null): CursorPayload | null {
  if (!cursor) return null;
  try {
    const jsonStr = Buffer.from(cursor, "base64url").toString("utf-8");
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed.id === "string" && typeof parsed.createdAt === "string") {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export function paginateArray<T extends { id: string; createdAt: Date | string }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  let nextCursor: string | null = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    nextCursor = encodeCursor({
      id: lastItem.id,
      createdAt:
        typeof lastItem.createdAt === "string"
          ? lastItem.createdAt
          : lastItem.createdAt.toISOString(),
    });
  }

  return {
    data,
    nextCursor,
    hasMore,
    limit,
  };
}
