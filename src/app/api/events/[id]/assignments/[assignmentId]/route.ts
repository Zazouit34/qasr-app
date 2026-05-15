import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; assignmentId: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "events:update");
  if (deny) return deny;
  const { id, assignmentId } = await context.params;
  const venueId = ctx.user.venueId;

  const event = await prisma.event.findFirst({
    where: { id, venueId },
    select: { id: true },
  });
  if (!event) return apiError("Événement introuvable", 404);

  const row = await prisma.eventAssignment.findFirst({
    where: { id: assignmentId, eventId: id },
  });
  if (!row) return apiError("Affectation introuvable", 404);

  await prisma.eventAssignment.delete({ where: { id: assignmentId } });
  return apiOk({ id: assignmentId });
}
