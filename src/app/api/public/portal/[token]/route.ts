import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api-context";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  const access = await prisma.eventGuestAccess.findFirst({
    where: { token },
    include: {
      event: {
        include: {
          venue: {
            select: { name: true, phone: true, email: true },
          },
          client: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          hall: { select: { name: true } },
          payments: {
            select: {
              paymentNumber: true,
              amount: true,
              type: true,
              status: true,
              dueDate: true,
              paidAt: true,
            },
          },
        },
      },
    },
  });

  if (!access || !access.event) return apiError("Lien invalide.", 404);
  if (
    access.expiresAt &&
    access.expiresAt < new Date()
  ) {
    return apiError("Ce lien a expiré.", 410);
  }

  const e = access.event;
  const paid = e.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return apiOk({
    venueName: e.venue.name,
    venueContact: `${e.venue.phone} · ${e.venue.email}`,
    eventTitle: e.title,
    eventNumber: e.eventNumber,
    eventDate: e.eventDate.toISOString(),
    hallName: e.hall?.name ?? null,
    guestCount: e.guestCount,
    clientDisplay: `${e.client.firstName} ${e.client.lastName}`,
    totalPrice: e.totalPrice,
    paid,
    balance: e.totalPrice - paid,
    payments: e.payments,
  });
}
