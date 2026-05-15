import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk } from "@/lib/api-context";

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;

  const venueId = ctx.user.venueId;
  const now = new Date();
  const horizon = new Date(now);
  horizon.setHours(horizon.getHours() + 48);

  const [overdue, upcomingUnsigned, upcomingEvents] = await Promise.all([
    prisma.payment.count({
      where: {
        venueId,
        status: "PENDING",
        dueDate: { lt: now },
      },
    }),
    prisma.contract.count({
      where: {
        venueId,
        status: { in: ["DRAFT", "SENT"] },
      },
    }),
    prisma.event.count({
      where: {
        venueId,
        eventDate: { gte: now, lte: horizon },
        status: { in: ["CONFIRMED", "PENDING", "IN_PROGRESS"] },
      },
    }),
  ]);

  const total = overdue + upcomingUnsigned + upcomingEvents;

  return apiOk({
    total,
    items: [
      { type: "overdue", label: "Paiements en retard", count: overdue },
      { type: "contracts", label: "Contrats non signés", count: upcomingUnsigned },
      { type: "upcoming", label: "Événements sous 48h", count: upcomingEvents },
    ],
  });
}
