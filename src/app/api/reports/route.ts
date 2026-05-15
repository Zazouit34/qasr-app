import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import {
  startOfYear,
  endOfYear,
  subYears,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "reports:read");
  if (deny) return deny;

  const type = req.nextUrl.searchParams.get("type") ?? "overview";
  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());

  const venueId = ctx.user.venueId;
  const yStart = startOfYear(new Date(year, 0, 1));
  const yEnd = endOfYear(new Date(year, 0, 1));

  if (type === "financial") {
    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: {
          venueId,
          status: "PAID",
          paidAt: { gte: yStart, lte: yEnd },
        },
        select: { amount: true, method: true, paidAt: true },
      }),
      prisma.expense.findMany({
        where: { venueId, date: { gte: yStart, lte: yEnd } },
        select: { amount: true, category: true, date: true },
      }),
    ]);
    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      const k = p.method;
      byMethod[k] = (byMethod[k] ?? 0) + p.amount;
    }
    return apiOk({ payments, expenses, byMethod });
  }

  if (type === "clients") {
    const clients = await prisma.client.findMany({
      where: { venueId },
      include: { events: true },
    });
    const repeat = clients.filter((c) => c.events.length >= 2).length;
    return apiOk({ total: clients.length, repeat });
  }

  if (type === "operational") {
    const events = await prisma.event.findMany({
      where: { venueId, eventDate: { gte: yStart, lte: yEnd } },
      include: { hall: true },
    });
    const cancelled = events.filter((e) => e.status === "CANCELLED").length;
    return apiOk({ count: events.length, cancellationRate: events.length ? cancelled / events.length : 0 });
  }

  const events = await prisma.event.groupBy({
    by: ["type"],
    where: { venueId: ctx.user.venueId, eventDate: { gte: yStart, lte: yEnd } },
    _count: { _all: true },
  });

  const byHall = await prisma.event.groupBy({
    by: ["hallId"],
    where: { venueId, eventDate: { gte: yStart, lte: yEnd }, hallId: { not: null } },
    _count: { _all: true },
  });

  return apiOk({ type, year, eventsByType: events, eventsByHall: byHall });
}
