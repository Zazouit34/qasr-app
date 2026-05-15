import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().nullable().optional(),
  salary: z.number().nullable().optional(),
  joinDate: z.string().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "staff:update");
  if (deny) return deny;
  const { id } = await context.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const row = await prisma.staffMember.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!row) return apiError("Introuvable", 404);

  const { joinDate, ...rest } = body;
  const updated = await prisma.staffMember.update({
    where: { id },
    data: {
      ...rest,
      ...(joinDate ? { joinDate: new Date(joinDate) } : {}),
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
  const deny = assertCan(ctx.user.role, "staff:delete");
  if (deny) return deny;
  const { id } = await context.params;
  const row = await prisma.staffMember.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!row) return apiError("Introuvable", 404);
  await prisma.staffMember.delete({ where: { id } });
  return apiOk({ id });
}
