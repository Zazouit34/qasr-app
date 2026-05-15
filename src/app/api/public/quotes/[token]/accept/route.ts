import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api-context";
import { allocateEventNumber, allocatePaymentNumber } from "@/lib/utils";
import {
  EventStatus,
  EventType,
  PaymentMethod,
  PaymentType,
  QuoteStatus,
  ReminderType,
} from "@prisma/client";

const CHECKLIST_DEFAULT = [
  "Contrat signé",
  "Acompte reçu (30%)",
  "Menu confirmé",
  "Effectif final confirmé (J-7)",
  "Solde final réglé",
];

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  const quote = await prisma.quote.findFirst({
    where: { acceptanceToken: token },
    include: {
      client: true,
      venue: { include: { settings: true } },
    },
  });
  if (!quote) return apiError("Devis introuvable", 404);

  if (quote.status === QuoteStatus.ACCEPTED) {
    return apiOk({ eventId: quote.eventId, alreadyAccepted: true });
  }
  if (
    quote.status === QuoteStatus.REJECTED ||
    quote.status === QuoteStatus.EXPIRED
  ) {
    return apiError("Ce devis n’est plus valable.", 400);
  }
  if (
    quote.validUntil &&
    quote.validUntil < new Date()
  ) {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: QuoteStatus.EXPIRED },
    });
    return apiError("Ce devis a expiré.", 400);
  }

  if (!quote.proposalEventDate || !quote.proposalHallId) {
    return apiError(
      "Le lieu doit compléter la date et la salle proposées avant acceptation.",
      400,
    );
  }

  const venueId = quote.venueId;
  const hall = await prisma.hall.findFirst({
    where: { id: quote.proposalHallId, venueId, isActive: true },
  });
  if (!hall) return apiError("La salle proposée n’est plus disponible.", 400);

  const depositPct =
    quote.venue.settings?.defaultDepositPct ?? 30;
  const eventDate = quote.proposalEventDate;
  const guestCount = quote.proposalGuests ?? 120;

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (quote.eventId) {
        const target = await tx.event.findFirst({
          where: { id: quote.eventId, venueId },
        });
        if (!target) throw new Error("EVENT_NOT_FOUND_FOR_QUOTE");

        const evt = await tx.event.update({
          where: { id: target.id },
          data: {
            status: EventStatus.CONFIRMED,
            confirmedAt: new Date(),
            hallId: hall.id,
          },
        });
        await tx.quote.update({
          where: { id: quote.id },
          data: {
            status: QuoteStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        });
        return evt;
      }

      const year = new Date().getFullYear();
      const eventNumber = await allocateEventNumber(tx.event, year);

      const title =
        quote.title?.trim() || `Réception suite au devis ${quote.quoteNumber}`;

      const event = await tx.event.create({
        data: {
          venueId,
          clientId: quote.clientId,
          hallId: hall.id,
          eventNumber,
          type: EventType.WEDDING,
          status: EventStatus.CONFIRMED,
          title,
          eventDate,
          startTime: "18:00",
          endTime: "02:00",
          guestCount,
          groomName: null,
          brideName: null,
          basePrice: quote.total,
          totalPrice: quote.total,
          discountAmount: 0,
          confirmedAt: new Date(),
        },
      });

      let order = 0;
      for (const label of CHECKLIST_DEFAULT) {
        await tx.checklistItem.create({
          data: {
            eventId: event.id,
            label,
            order: order++,
            category: "Mariage",
          },
        });
      }

      const deposit =
        Math.round((quote.total * depositPct) / 100 / 1000) * 1000;
      const paymentNumber = await allocatePaymentNumber(tx.payment, year);
      await tx.payment.create({
        data: {
          venueId,
          eventId: event.id,
          paymentNumber,
          amount: deposit,
          type: PaymentType.DEPOSIT,
          method: PaymentMethod.BANK_TRANSFER,
          status: "PENDING",
          dueDate: eventDate,
        },
      });

      await tx.reminder.createMany({
        data: [
          {
            eventId: event.id,
            type: ReminderType.PAYMENT_DUE,
            message: "Acompte à recevoir suite au devis",
            dueDate: eventDate,
          },
        ],
      });

      await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: QuoteStatus.ACCEPTED,
          acceptedAt: new Date(),
          eventId: event.id,
        },
      });

      return event;
    });

    return apiOk({
      success: true,
      eventId: result.id,
      eventNumber:
        "eventNumber" in result ? (result.eventNumber as string) : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "EVENT_NOT_FOUND_FOR_QUOTE")
      return apiError("Événement du devis introuvable.", 400);
    console.error(e);
    return apiError("Impossible d’accepter le devis.", 500, e);
  }
}
