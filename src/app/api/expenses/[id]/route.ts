import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

const patchSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  description: z.string().optional(),
  amount: z.number().optional(),
  date: z.string().optional(),
  vendor: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  eventId: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "expenses:update");
  if (deny) return deny;
  const { id } = await context.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const row = await prisma.expense.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!row) return apiError("Introuvable", 404);

  if (body.eventId) {
    const evt = await prisma.event.findFirst({
      where: { id: body.eventId, venueId: ctx.user.venueId },
    });
    if (!evt) return apiError("Événement introuvable", 404);
  }

  const data: Record<string, unknown> = { ...body };
  if (body.date) data.date = new Date(body.date);

  const updated = await prisma.expense.update({
    where: { id },
    data,
  });
  return apiOk(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "expenses:delete");
  if (deny) return deny;
  const { id } = await context.params;
  const row = await prisma.expense.findFirst({
    where: { id, venueId: ctx.user.venueId },
  });
  if (!row) return apiError("Introuvable", 404);
  await prisma.expense.delete({ where: { id } });
  return apiOk({ id });
}
