import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const venuePatchSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(3).optional(),
  city: z.string().min(1).optional(),
  wilaya: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
});

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;

  const venue = await prisma.venue.findUnique({
    where: { id: ctx.user.venueId },
    include: {
      settings: true,
      halls: { where: { isActive: true }, orderBy: { name: "asc" } },
      _count: { select: { services: true, amenities: true, packages: true, menuTemplates: true } },
    },
  });
  if (!venue) return apiError("Lieu introuvable", 404);
  return apiOk(venue);
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "settings:update");
  if (deny) return deny;

  let body: z.infer<typeof venuePatchSchema>;
  try {
    body = venuePatchSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const updated = await prisma.venue.update({
    where: { id: ctx.user.venueId },
    data: body,
    include: { settings: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: ctx.user.id,
      action: "VENUE_PROFILE_UPDATED",
      entity: "Venue",
      entityId: ctx.user.venueId,
    },
  });

  return apiOk(updated);
}
