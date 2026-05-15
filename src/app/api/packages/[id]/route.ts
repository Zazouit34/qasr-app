import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  basePrice: z.number().optional(),
  minGuests: z.number().nullable().optional(),
  maxGuests: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string(),
        isIncluded: z.boolean().optional(),
      }),
    )
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "packages:update");
  if (deny) return deny;
  const { id } = await context.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const pack = await prisma.package.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!pack) return apiError("Introuvable", 404);

  const { items, ...rest } = body;

  await prisma.$transaction(async (tx) => {
    await tx.package.update({
      where: { id },
      data: rest,
    });
    if (items) {
      await tx.packageItem.deleteMany({ where: { packageId: id } });
      for (const it of items) {
        await tx.packageItem.create({
          data: {
            packageId: id,
            label: it.label,
            isIncluded: it.isIncluded ?? true,
          },
        });
      }
    }
  });

  const updated = await prisma.package.findFirst({
    where: { id },
    include: { items: true },
  });
  return apiOk(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "packages:delete");
  if (deny) return deny;
  const { id } = await context.params;
  const pack = await prisma.package.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!pack) return apiError("Introuvable", 404);
  await prisma.package.delete({ where: { id } });
  return apiOk({ id });
}
