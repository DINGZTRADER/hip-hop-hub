import { NextRequest, NextResponse } from "next/server";
import { createServiceBooking, getBookingsForArtist } from "@/lib/data-service";
import { handleApiError, createErrorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    if (!artistId) {
      return createErrorResponse(
        "ARTIST_ID_REQUIRED",
        "artistId query parameter is required.",
        400
      );
    }
    const bookings = await getBookingsForArtist(artistId);
    return NextResponse.json({ success: true, bookings }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serviceId,
      artistId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate,
      eventLocation,
      notes,
      quotedPriceUgx,
    } = body;

    if (!serviceId || !artistId || !clientName || !clientEmail || !clientPhone || !eventDate || !eventLocation) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Please provide all required event and contact information.",
        400
      );
    }

    const booking = await createServiceBooking({
      serviceId,
      artistId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate,
      eventLocation,
      notes,
      quotedPriceUgx: quotedPriceUgx || 2000000,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your booking request has been submitted to the artist's management.",
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
