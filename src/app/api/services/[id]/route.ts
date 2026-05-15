import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";
import { ServiceCategory, PriceType } from "@prisma/client";

const patchSchema = z.object({
  name: z.string().optional(),
  nameAr: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().optional(),
  priceType: z.nativeEnum(PriceType).optional(),
  unit: z.string().nullable().optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "services:update");
  if (deny) return deny;
  const { id } = await context.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const row = await prisma.service.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!row) return apiError("Introuvable", 404);

  const updated = await prisma.service.update({
    where: { id },
    data: body,
  });
  return apiOk(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "services:delete");
  if (deny) return deny;

  const { id } = await context.params;
  const row = await prisma.service.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!row) return apiError("Introuvable", 404);

  await prisma.service.delete({ where: { id } });
  return apiOk({ id });
}
