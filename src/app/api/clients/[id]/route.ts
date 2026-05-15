import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "clients:read");
  if (deny) return deny;
  const { id } = await context.params;

  const client = await prisma.client.findFirst({
    where: { id, venueId: ctx.user.venueId },
    include: {
      events: {
        orderBy: { eventDate: "desc" },
        include: { payments: true, hall: { select: { name: true } } },
      },
      documents: true,
    },
  });
  if (!client) return apiError("Client introuvable", 404);

  const payments = await prisma.payment.findMany({
    where: {
      venueId: ctx.user.venueId,
      event: { clientId: id },
    },
    orderBy: { createdAt: "desc" },
    include: { event: { select: { title: true, eventNumber: true } } },
  });

  const totalSpent = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);
  const outstanding = payments
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + p.amount, 0);

  return apiOk({
    ...client,
    payments,
    stats: {
      totalSpent,
      outstanding,
      eventCount: client.events.length,
    },
  });
}

const patchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  wilaya: z.string().nullable().optional(),
  nationalId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isVIP: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "clients:update");
  if (deny) return deny;
  const { id } = await context.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const existing = await prisma.client.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!existing) return apiError("Client introuvable", 404);

  const updated = await prisma.client.update({
    where: { id },
    data: body,
  });

  return apiOk(updated);
}
