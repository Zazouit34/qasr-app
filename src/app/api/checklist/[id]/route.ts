import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  isDone: z.boolean(),
});

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

  const existing = await prisma.checklistItem.findFirst({
    where: { id, event: { venueId: ctx.user.venueId } },
  });
  if (!existing) return apiError("Élément introuvable", 404);

  const updated = await prisma.checklistItem.update({
    where: { id },
    data: { isDone: body.isDone },
  });

  await prisma.activityLog.create({
    data: {
      userId: ctx.user.id,
      action: "CHECKLIST_TOGGLE",
      entity: "ChecklistItem",
      entityId: id,
      details: { label: existing.label, isDone: body.isDone },
    },
  });

  return apiOk(updated);
}
