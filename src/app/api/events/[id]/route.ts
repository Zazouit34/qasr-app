import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan, can } from "@/lib/permissions";
import type { EventStatus, Prisma } from "@prisma/client";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "events:read");
  if (deny) return deny;
  const { id } = await context.params;

  const event = await prisma.event.findFirst({
    where: { id, venueId: ctx.user.venueId },
    include: {
      venue: true,
      client: true,
      hall: true,
      payments: { orderBy: { createdAt: "asc" } },
      services: { include: { service: true } },
      amenities: { include: { amenity: true } },
      contracts: true,
      documents: true,
      reminders: true,
      checklist: true,
      assignments: { include: { staffMember: true } },
      quotes: { orderBy: { createdAt: "desc" }, take: 20 },
      menuTemplate: {
        select: {
          id: true,
          name: true,
          basePrice: true,
          groceryItems: { orderBy: { sortOrder: "asc" }, take: 200 },
        },
      },
    },
  });
  if (!event) return apiError("Événement introuvable", 404);

  const paid = event.payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const logs = await prisma.activityLog.findMany({
    where: {
      entity: "Event",
      entityId: id,
      user: { venueId: ctx.user.venueId },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, avatar: true } } },
  });

  return apiOk({ ...event, paid, balance: event.totalPrice - paid, logs });
}

const patchSchema = z.object({
  hallId: z.string().nullable().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  eventDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  guestCount: z.number().optional(),
  groomName: z.string().nullable().optional(),
  brideName: z.string().nullable().optional(),
  groomPhone: z.string().nullable().optional(),
  bridePhone: z.string().nullable().optional(),
  basePrice: z.number().optional(),
  totalPrice: z.number().optional(),
  discountAmount: z.number().optional(),
  discountReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  status: z.string().optional(),
  contractSigned: z.boolean().optional(),
  contractDate: z.string().nullable().optional(),
  clientId: z.string().optional(),
  menuTemplateId: z.string().nullable().optional(),
});

async function hallCountForVenue(venueId: string) {
  return prisma.hall.count({ where: { venueId, isActive: true } });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "events:update");
  if (deny) return deny;
  const { id } = await context.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const existing = await prisma.event.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!existing) return apiError("Événement introuvable", 404);

  if (body.hallId !== undefined) {
    if (body.hallId === null) {
      const hCount = await hallCountForVenue(ctx.user.venueId);
      if (hCount > 0) {
        return apiError("Une salle doit être sélectionnée pour ce lieu.", 400);
      }
    } else {
      const hallOk = await prisma.hall.findFirst({
        where: { id: body.hallId, venueId: ctx.user.venueId, isActive: true },
      });
      if (!hallOk) return apiError("Salle introuvable ou inactive.", 404);
    }
  }

  if (body.menuTemplateId !== undefined && body.menuTemplateId !== null) {
    const menu = await prisma.menuTemplate.findFirst({
      where: { id: body.menuTemplateId, venueId: ctx.user.venueId },
    });
    if (!menu) return apiError("Menu introuvable", 404);
  }

  const data: Prisma.EventUpdateInput = {};
  if (body.hallId !== undefined)
    data.hall = body.hallId
      ? { connect: { id: body.hallId } }
      : { disconnect: true };
  if (body.type !== undefined) data.type = body.type as never;
  if (body.title !== undefined) data.title = body.title;
  if (body.eventDate !== undefined) data.eventDate = new Date(body.eventDate);
  if (body.startTime !== undefined) data.startTime = body.startTime;
  if (body.endTime !== undefined) data.endTime = body.endTime;
  if (body.guestCount !== undefined) data.guestCount = body.guestCount;
  if (body.groomName !== undefined) data.groomName = body.groomName;
  if (body.brideName !== undefined) data.brideName = body.brideName;
  if (body.groomPhone !== undefined) data.groomPhone = body.groomPhone;
  if (body.bridePhone !== undefined) data.bridePhone = body.bridePhone;
  if (body.basePrice !== undefined) data.basePrice = body.basePrice;
  if (body.totalPrice !== undefined) data.totalPrice = body.totalPrice;
  if (body.discountAmount !== undefined) data.discountAmount = body.discountAmount;
  if (body.discountReason !== undefined) data.discountReason = body.discountReason;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes;
  if (body.status !== undefined) data.status = body.status as EventStatus;
  if (body.contractSigned !== undefined) data.contractSigned = body.contractSigned;
  if (body.contractDate !== undefined)
    data.contractDate = body.contractDate ? new Date(body.contractDate) : null;
  if (body.clientId !== undefined)
    data.client = { connect: { id: body.clientId } };
  if (body.menuTemplateId !== undefined)
    data.menuTemplate = body.menuTemplateId
      ? { connect: { id: body.menuTemplateId } }
      : { disconnect: true };

  const updated = await prisma.event.update({
    where: { id },
    data,
  });

  await prisma.activityLog.create({
    data: {
      userId: ctx.user.id,
      action: "EVENT_UPDATED",
      entity: "Event",
      entityId: id,
    },
  });

  return apiOk(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  if (!can(ctx.user.role, "events:delete")) {
    return apiError("Non autorisé", 403);
  }
  const { id } = await context.params;

  const existing = await prisma.event.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!existing) return apiError("Événement introuvable", 404);

  await prisma.event.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: ctx.user.id,
      action: "EVENT_CANCELLED",
      entity: "Event",
      entityId: id,
    },
  });

  return apiOk({ id, status: "CANCELLED" });
}
