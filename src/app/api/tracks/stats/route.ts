import { NextRequest, NextResponse } from "next/server";
import { getTrackStatistics } from "@/lib/track-statistics";
import { isUuid } from "@/lib/media-upload-policy";
import { createErrorResponse, handleApiError } from "@/lib/errors";
export async function GET(request:NextRequest) {
  try {
    const ids=[...new Set((request.nextUrl.searchParams.get("ids")||"").split(",").filter(Boolean))];
    if(!ids.length||ids.length>10||ids.some(id=>!isUuid(id)))return createErrorResponse("INVALID_TRACKS","Choose up to ten valid tracks.",400);
    return NextResponse.json({tracks:await getTrackStatistics(ids)},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return handleApiError(error);}
}
