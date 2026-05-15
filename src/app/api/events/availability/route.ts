import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "events:read");
  if (deny) return deny;

  const date = req.nextUrl.searchParams.get("date");
  const hallId = req.nextUrl.searchParams.get("hallId");
  if (!date || !hallId) {
    return apiError("Paramètres date et hallId requis", 400);
  }

  const day = new Date(date);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  const conflicting = await prisma.event.findMany({
    where: {
      venueId: ctx.user.venueId,
      hallId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      eventDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    select: {
      id: true,
      title: true,
      eventNumber: true,
      startTime: true,
      endTime: true,
      status: true,
    },
  });

  const available = conflicting.length === 0;
  return apiOk({ available, conflictingEvents: conflicting });
}
