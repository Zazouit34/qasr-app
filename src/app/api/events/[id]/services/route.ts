import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const bodySchema = z.object({
  serviceId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  notes: z.string().nullable().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "events:update");
  if (deny) return deny;
  const { id: eventId } = await context.params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, venueId: ctx.user.venueId },
  });
  if (!event) return apiError("Événement introuvable", 404);

  const svc = await prisma.service.findFirst({
    where: { id: body.serviceId, venueId: ctx.user.venueId },
  });
  if (!svc) return apiError("Service introuvable", 404);

  const totalPrice = body.quantity * body.unitPrice;
  const line = await prisma.eventService.create({
    data: {
      eventId,
      serviceId: svc.id,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      totalPrice,
      notes: body.notes,
    },
    include: { service: true },
  });

  return apiOk(line, 201);
}
