import prisma from "@/lib/prisma";
import type { PaymentType } from "@prisma/client";
import type { EventStatus } from "@prisma/client";

const EPS = 1;

export async function applyPaymentSideEffects(
  eventId: string,
  venueId: string,
  actorUserId: string,
  payment: { type: PaymentType; status: string; amount: number },
) {
  if (payment.status !== "PAID") return;

  const event = await prisma.event.findFirst({
    where: { id: eventId, venueId },
    include: { payments: true },
  });
  if (!event) return;

  const paidTotal = event.payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  let nextStatus: EventStatus = event.status;

  if (paidTotal >= event.totalPrice - EPS && event.totalPrice > 0) {
    nextStatus = "COMPLETED";
  } else if (
    payment.type === "DEPOSIT" &&
    ["INQUIRY", "QUOTE_SENT", "PENDING"].includes(event.status)
  ) {
    nextStatus = "CONFIRMED";
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      status: nextStatus,
      ...(nextStatus === "CONFIRMED" && !event.confirmedAt
        ? { confirmedAt: new Date() }
        : {}),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: actorUserId,
      action: "PAYMENT_RECORDED",
      entity: "Payment",
      entityId: eventId,
      details: {
        paymentType: payment.type,
        amount: payment.amount,
      },
    },
  });
}
