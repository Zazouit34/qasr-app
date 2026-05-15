import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { generatePaymentNumber } from "@/lib/utils";
import { applyPaymentSideEffects } from "@/lib/payment-side-effects";
import { PaymentMethod, PaymentStatus, PaymentType } from "@prisma/client";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "payments:read");
  if (deny) return deny;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const type = sp.get("type");
  const eventId = sp.get("eventId");
  const tab = sp.get("tab");

  const where: Record<string, unknown> = { venueId: ctx.user.venueId };
  if (eventId) where.eventId = eventId;
  if (type && type !== "ALL") where.type = type as PaymentType;

  const now = new Date();
  if (status && status !== "ALL") where.status = status as PaymentStatus;
  if (tab === "pending") where.status = "PENDING";
  if (tab === "paid") where.status = "PAID";
  if (tab === "overdue") {
    where.status = "PENDING";
    where.dueDate = { lt: now };
  }
  if (tab === "refunds") where.type = "REFUND";

  const items = await prisma.payment.findMany({
    where,
    orderBy: [{ dueDate: "asc" }],
    include: {
      event: {
        include: {
          client: { select: { firstName: true, lastName: true } },
        },
      },
    },
    take: 500,
  });

  const expected = await prisma.event.aggregate({
    where: {
      venueId: ctx.user.venueId,
      status: { in: ["CONFIRMED", "COMPLETED", "PENDING", "IN_PROGRESS"] },
    },
    _sum: { totalPrice: true },
  });

  const collected = await prisma.payment.aggregate({
    where: { venueId: ctx.user.venueId, status: "PAID" },
    _sum: { amount: true },
  });

  const outstanding = await prisma.payment.aggregate({
    where: { venueId: ctx.user.venueId, status: "PENDING" },
    _sum: { amount: true },
  });

  const overdueAmt = items
    .filter((p) => p.status === "PENDING" && p.dueDate && p.dueDate < now)
    .reduce((s, p) => s + p.amount, 0);

  return apiOk({
    items,
    overview: {
      expectedRevenue: expected._sum.totalPrice ?? 0,
      collected: collected._sum.amount ?? 0,
      outstanding: outstanding._sum.amount ?? 0,
      overdueAmount: overdueAmt,
    },
  });
}

const createSchema = z.object({
  eventId: z.string(),
  amount: z.number().positive(),
  type: z.nativeEnum(PaymentType),
  method: z.nativeEnum(PaymentMethod),
  status: z.nativeEnum(PaymentStatus).optional(),
  dueDate: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "payments:create");
  if (deny) return deny;
  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const event = await prisma.event.findFirst({
    where: { id: body.eventId, venueId: ctx.user.venueId },
  });
  if (!event) return apiError("Événement introuvable", 404);

  const paymentNumber = await generatePaymentNumber(ctx.user.venueId);
  const status = body.status ?? ("PENDING" as PaymentStatus);

  const payment = await prisma.payment.create({
    data: {
      venueId: ctx.user.venueId,
      eventId: event.id,
      paymentNumber,
      amount: body.amount,
      type: body.type,
      method: body.method,
      status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidAt: body.paidAt ? new Date(body.paidAt) : status === "PAID" ? new Date() : null,
      reference: body.reference,
      notes: body.notes,
      receiptUrl: body.receiptUrl,
      recordedBy: ctx.user.id,
    },
  });

  if (payment.status === "PAID") {
    await applyPaymentSideEffects(event.id, ctx.user.venueId, ctx.user.id, {
      type: payment.type,
      status: payment.status,
      amount: payment.amount,
    });
  }

  return apiOk(payment, 201);
}
