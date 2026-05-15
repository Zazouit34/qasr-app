import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk } from "@/lib/api-context";

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;

  const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (raw.length < 2) {
    return apiOk({ clients: [], events: [], payments: [] });
  }

  const q = raw;
  const venueId = ctx.user.venueId;

  const [clients, events, payments] = await Promise.all([
    prisma.client.findMany({
      where: {
        venueId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { phone2: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
      select: { id: true, firstName: true, lastName: true, phone: true },
    }),
    prisma.event.findMany({
      where: {
        venueId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { eventNumber: { contains: q, mode: "insensitive" } },
          { client: { phone: { contains: q } } },
          { client: { phone2: { contains: q } } },
          { client: { firstName: { contains: q, mode: "insensitive" } } },
          { client: { lastName: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: 8,
      orderBy: { eventDate: "desc" },
      select: {
        id: true,
        title: true,
        eventNumber: true,
        eventDate: true,
        client: { select: { firstName: true, lastName: true, phone: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        venueId,
        OR: [{ paymentNumber: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }],
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        status: true,
        eventId: true,
        event: { select: { title: true } },
      },
    }),
  ]);

  return apiOk({
    clients: clients.map((c) => ({
      type: "client" as const,
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: c.phone,
      href: `/clients/${c.id}`,
    })),
    events: events.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.title,
      subtitle: `${e.eventNumber} · ${e.client.firstName} ${e.client.lastName} · ${e.client.phone}`,
      href: `/events/${e.id}`,
    })),
    payments: payments.map((p) => ({
      type: "payment" as const,
      id: p.id,
      title: p.paymentNumber,
      subtitle: `${p.event.title} · ${p.status}`,
      href: `/events/${p.eventId}?tab=payments`,
    })),
  });
}
