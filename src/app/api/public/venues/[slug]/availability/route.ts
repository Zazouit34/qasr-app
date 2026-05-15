import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api-context";

/** Privacy-safe availability: occupied event dates only (no client names). */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const venue = await prisma.venue.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true },
  });
  if (!venue) return apiError("Lieu introuvable", 404);

  const dateRange: { gte?: Date; lte?: Date } = {};
  if (from) dateRange.gte = new Date(from);
  if (to) dateRange.lte = new Date(to);

  const blocked = await prisma.event.findMany({
    where: {
      venueId: venue.id,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(Object.keys(dateRange).length ? { eventDate: dateRange } : {}),
    },
    select: {
      eventDate: true,
      status: true,
    },
    orderBy: { eventDate: "asc" },
    take: 500,
  });

  const busyDates = [...new Set(blocked.map((e) => e.eventDate.toISOString().slice(0, 10)))];

  return apiOk({
    venueName: venue.name,
    busyDates,
  });
}
