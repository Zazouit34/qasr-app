import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { QuoteStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const patchQuoteSchema = z.object({
  status: z.nativeEnum(QuoteStatus).optional(),
  title: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lineItems: z.unknown().optional(),
  total: z.number().optional(),
  proposalEventDate: z.string().nullable().optional(),
  proposalHallId: z.string().nullable().optional(),
  proposalGuests: z.number().int().positive().nullable().optional(),
  validUntil: z.string().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "quotes:read");
  if (deny) return deny;
  const { id } = await context.params;

  const quote = await prisma.quote.findFirst({
    where: { id, venueId: ctx.user.venueId },
    include: {
      client: true,
      event: { select: { id: true, title: true, eventNumber: true, status: true } },
    },
  });
  if (!quote) return apiError("Devis introuvable", 404);
  return apiOk(quote);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "quotes:update");
  if (deny) return deny;
  const { id } = await context.params;

  let body: z.infer<typeof patchQuoteSchema>;
  try {
    body = patchQuoteSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const existing = await prisma.quote.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!existing) return apiError("Devis introuvable", 404);

  const data: Prisma.QuoteUpdateInput = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.lineItems !== undefined)
    data.lineItems = body.lineItems as Prisma.InputJsonValue;
  if (body.total !== undefined) data.total = body.total;
  if (body.proposalEventDate !== undefined)
    data.proposalEventDate =
      body.proposalEventDate ? new Date(body.proposalEventDate) : null;
  if (body.proposalHallId !== undefined) data.proposalHallId = body.proposalHallId;
  if (body.proposalGuests !== undefined) data.proposalGuests = body.proposalGuests;
  if (body.validUntil !== undefined)
    data.validUntil = body.validUntil ? new Date(body.validUntil) : null;

  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === QuoteStatus.SENT) {
      data.sentAt = existing.sentAt ?? new Date();
    }
  }

  const updated = await prisma.quote.update({
    where: { id },
    data,
  });
  return apiOk(updated);
}
