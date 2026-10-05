import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { requireDb, schema } from "@/db";
export const verifiedPurchaseCount = () => sql<number>`(select count(*)::int from ${schema.purchases} where ${schema.purchases.trackId} = ${schema.tracks.id} and ${schema.purchases.status} = 'COMPLETED')`;
export async function getTrackStatistics(ids: string[]) {
  return requireDb().select({id:schema.tracks.id,playCount:schema.tracks.playCount,purchaseCount:verifiedPurchaseCount()}).from(schema.tracks).innerJoin(schema.artists,eq(schema.artists.id,schema.tracks.artistId)).where(and(inArray(schema.tracks.id,ids),isNull(schema.tracks.deletedAt),eq(schema.tracks.isPublished,true),isNull(schema.artists.deletedAt)));
}
