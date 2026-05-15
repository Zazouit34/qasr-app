import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { allocateQuoteNumber } from "@/lib/utils";
import { QuoteStatus } from "@prisma/client";
import { z } from "zod";

const lineItemSchema = z.object({
  label: z.string(),
  qty: z.number().optional(),
  unitPrice: z.number(),
  total: z.number(),
});

const createQuoteSchema = z.object({
  clientId: z.string(),
  title: z.string().optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1),
  total: z.number(),
  notes: z.string().optional().nullable(),
  proposalEventDate: z.string().optional().nullable(),
  proposalHallId: z.string().optional().nullable(),
  proposalGuests: z.number().int().positive().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "quotes:read");
  if (deny) return deny;

  const params = req.nextUrl.searchParams;
  const status = params.get("status");

  const where: Record<string, unknown> = { venueId: ctx.user.venueId };
  if (status && status !== "ALL") where.status = status as QuoteStatus;

  const rows = await prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      client: { select: { id: true, firstName: true, lastName: true, phone: true } },
      event: { select: { id: true, title: true, eventNumber: true } },
    },
  });
  return apiOk(rows);
}

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "quotes:create");
  if (deny) return deny;

  let body: z.infer<typeof createQuoteSchema>;
  try {
    body = createQuoteSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const venueId = ctx.user.venueId;

  const client = await prisma.client.findFirst({
    where: { id: body.clientId, venueId },
  });
  if (!client) return apiError("Client introuvable", 404);

  if (body.eventId) {
    const ev = await prisma.event.findFirst({
      where: { id: body.eventId, venueId },
    });
    if (!ev) return apiError("Événement introuvable", 404);
  }

  const token = randomBytes(32).toString("hex");
  const year = new Date().getFullYear();

  const quoteNumber = await allocateQuoteNumber(prisma.quote, year);

  const quote = await prisma.quote.create({
    data: {
      venueId,
      clientId: body.clientId,
      eventId: body.eventId ?? null,
      quoteNumber,
      lineItems: body.lineItems,
      total: body.total,
      notes: body.notes ?? null,
      title: body.title ?? null,
      proposalEventDate: body.proposalEventDate ? new Date(body.proposalEventDate) : null,
      proposalHallId: body.proposalHallId ?? null,
      proposalGuests: body.proposalGuests ?? null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      acceptanceToken: token,
      status: QuoteStatus.DRAFT,
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: ctx.user.id,
      action: "QUOTE_CREATED",
      entity: "Quote",
      entityId: quote.id,
      details: { quoteNumber },
    },
  });

  return apiOk(quote, 201);
}
