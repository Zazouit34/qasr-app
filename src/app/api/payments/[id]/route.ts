import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { applyPaymentSideEffects } from "@/lib/payment-side-effects";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "payments:read");
  if (deny) return deny;
  const { id } = await context.params;

  const payment = await prisma.payment.findFirst({
    where: { id, venueId: ctx.user.venueId },
    include: {
      event: {
        include: {
          client: true,
          hall: true,
        },
      },
      venue: { select: { name: true, logoUrl: true, phone: true, address: true, city: true } },
    },
  });
  if (!payment) return apiError("Paiement introuvable", 404);
  return apiOk(payment);
}

const patchSchema = z.object({
  amount: z.number().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  dueDate: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "payments:create");
  if (deny) return deny;
  const { id } = await context.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const existing = await prisma.payment.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!existing) return apiError("Paiement introuvable", 404);

  const nextStatus = body.status ?? existing.status;
  const paidAt =
    body.paidAt !== undefined
      ? body.paidAt
        ? new Date(body.paidAt)
        : null
      : nextStatus === "PAID" && !existing.paidAt
        ? new Date()
        : existing.paidAt;

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      amount: body.amount ?? existing.amount,
      method: body.method ?? existing.method,
      status: nextStatus,
      dueDate:
        body.dueDate !== undefined
          ? body.dueDate
            ? new Date(body.dueDate)
            : null
          : existing.dueDate,
      paidAt: paidAt ?? undefined,
      reference: body.reference ?? existing.reference,
      notes: body.notes ?? existing.notes,
      receiptUrl: body.receiptUrl ?? existing.receiptUrl,
    },
  });

  if (updated.status === "PAID") {
    await applyPaymentSideEffects(
      updated.eventId,
      ctx.user.venueId,
      ctx.user.id,
      {
        type: updated.type,
        status: updated.status,
        amount: updated.amount,
      },
    );
  }

  return apiOk(updated);
}
