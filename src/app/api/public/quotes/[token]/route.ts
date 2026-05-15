import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiOk, apiError } from "@/lib/api-context";
import type { QuoteStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const quote = await prisma.quote.findFirst({
    where: { acceptanceToken: token },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          email: true,
          logoUrl: true,
        },
      },
    },
  });
  if (!quote) return apiError("Devis introuvable", 404);

  const clientMask = await prisma.client.findUnique({
    where: { id: quote.clientId },
    select: { firstName: true },
  });

  type LineRow = {
    label: string;
    qty?: number;
    unitPrice?: number;
    total?: number;
  };
  const lineItems =
    quote.lineItems && typeof quote.lineItems === "object" && Array.isArray(quote.lineItems)
      ? (quote.lineItems as LineRow[])
      : [];

  return apiOk({
    quoteNumber: quote.quoteNumber,
    title: quote.title,
    total: quote.total,
    notes: quote.notes,
    lineItems,
    venueName: quote.venue.name,
    venuePhone: quote.venue.phone,
    status: quote.status as QuoteStatus,
    validUntil: quote.validUntil?.toISOString() ?? null,
    proposalEventDate: quote.proposalEventDate?.toISOString() ?? null,
    clientFirstName: clientMask?.firstName ?? "",
  });
}
