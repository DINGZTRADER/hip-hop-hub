import { NextRequest, NextResponse } from "next/server";
import { createServiceBooking, getBookingsForArtist, getArtistById } from "@/lib/data-service";
import { getSession } from "@/lib/auth";
import { createErrorResponse, handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.artistId) return createErrorResponse("UNAUTHORIZED", "Artist sign in required.", 401);
    const artistId = new URL(request.url).searchParams.get("artistId") || session.artistId;
    if (artistId !== session.artistId) return createErrorResponse("FORBIDDEN", "Not your bookings.", 403);
    const artist = await getArtistById(artistId);
    if (!artist || artist.userId !== session.userId) return createErrorResponse("FORBIDDEN", "Not your bookings.", 403);
    const bookings = await getBookingsForArtist(artistId);
    return NextResponse.json({ success: true, bookings }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, artistId, clientName, clientEmail, clientPhone, eventDate, eventLocation, notes } = body;
    if (![serviceId, artistId, clientName, clientEmail, clientPhone, eventDate, eventLocation].every(
      value => typeof value === "string" && value.trim().length > 0) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) ||
      Number.isNaN(Date.parse(eventDate)) || new Date(eventDate).getTime() <= Date.now() ||
      clientName.length > 255 || clientEmail.length > 255 || clientPhone.length > 50 ||
      eventLocation.length > 2000 || (notes && (typeof notes !== "string" || notes.length > 4000)))
      return createErrorResponse("VALIDATION_ERROR", "Invalid booking information.", 400);
    const booking = await createServiceBooking({ serviceId, artistId, clientName: clientName.trim(),
      clientEmail: clientEmail.trim(), clientPhone: clientPhone.trim(),
      eventDate, eventLocation: eventLocation.trim(), notes });
    return NextResponse.json({ success: true, message: "Booking request submitted.", booking }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
