import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk } from "@/lib/api-context";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;

  const { venueId } = ctx.user;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 7);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const paidPayments = await prisma.payment.findMany({
    where: {
      venueId,
      status: "PAID",
      paidAt: { not: null },
    },
    select: { paidAt: true, amount: true },
  });

  const sumPaidInRange = (from: Date, to: Date) =>
    paidPayments
      .filter(
        (p) => p.paidAt && p.paidAt >= from && p.paidAt <= to,
      )
      .reduce((s, p) => s + p.amount, 0);

  const [
    eventsThisMonth,
    upcomingThisWeek,
    recentActivity,
    upcomingEventsRaw,
    pendingPaymentsRaw,
    eventsForStatus,
    pendingList,
  ] = await Promise.all([
    prisma.event.count({
      where: { venueId, eventDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.event.count({
      where: {
        venueId,
        eventDate: { gte: weekStart, lte: weekEnd },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.activityLog.findMany({
      where: { user: { venueId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, avatar: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        venueId,
        eventDate: { gte: now, lte: horizon },
        status: { in: ["CONFIRMED", "PENDING", "IN_PROGRESS"] },
      },
      orderBy: { eventDate: "asc" },
      take: 20,
      include: {
        client: { select: { firstName: true, lastName: true } },
        hall: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        venueId,
        status: "PENDING",
      },
      orderBy: [{ dueDate: "asc" }],
      take: 15,
      include: { event: { select: { id: true, title: true, client: { select: { firstName: true, lastName: true } } } } },
    }),
    prisma.event.groupBy({
      by: ["status"],
      where: { venueId },
      _count: { _all: true },
    }),
    prisma.payment.findMany({
      where: { venueId, status: "PENDING" },
      select: { amount: true },
    }),
  ]);

  const revenueThisMonth = sumPaidInRange(monthStart, monthEnd);
  const pendingPaymentsTotal = pendingList.reduce((s, p) => s + p.amount, 0);

  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const monthlyRevenue = months.map((m, idx) => {
    const from = startOfMonth(m);
    const to = endOfMonth(m);
    const total = sumPaidInRange(from, to);
    return { month: idx + 1, year: m.getFullYear(), total };
  });

  const revenueYoY = months.map((m, idx) => {
    const curFrom = startOfMonth(m);
    const curTo = endOfMonth(m);
    const current = sumPaidInRange(curFrom, curTo);
    const prevM = subYears(m, 1);
    const previous = sumPaidInRange(startOfMonth(prevM), endOfMonth(prevM));
    return { month: idx + 1, current, previous };
  });

  const statusBreakdown: Record<string, number> = {};
  for (const row of eventsForStatus) {
    statusBreakdown[row.status] = row._count._all;
  }

  return apiOk({
    eventsThisMonth,
    revenueThisMonth,
    pendingPaymentsTotal,
    upcomingThisWeek,
    recentActivity,
    upcomingEvents: upcomingEventsRaw.map((e) => ({
      id: e.id,
      eventDate: e.eventDate,
      title: e.title,
      type: e.type,
      guestCount: e.guestCount,
      hallName: e.hall?.name ?? null,
      clientName: `${e.client.firstName} ${e.client.lastName}`,
    })),
    pendingPayments: pendingPaymentsRaw.map((p) => ({
      id: p.id,
      eventId: p.event.id,
      amount: p.amount,
      dueDate: p.dueDate,
      eventTitle: p.event.title,
      clientName: `${p.event.client.firstName} ${p.event.client.lastName}`,
      paymentNumber: p.paymentNumber,
      status: p.status,
    })),
    monthlyRevenue,
    revenueYoY,
    statusBreakdown,
  });
}
