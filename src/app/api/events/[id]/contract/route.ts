import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const bodySchema = z.object({
  fileUrl: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "events:update");
  if (deny) return deny;
  const { id } = await context.params;
  const venueId = ctx.user.venueId;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const event = await prisma.event.findFirst({
    where: { id, venueId },
  });
  if (!event) return apiError("Événement introuvable", 404);

  const existing = await prisma.contract.findFirst({
    where: { eventId: id },
  });

  if (existing) {
    const updated = await prisma.contract.update({
      where: { id: existing.id },
      data: { fileUrl: body.fileUrl },
    });
    return apiOk(updated);
  }

  const created = await prisma.contract.create({
    data: {
      venueId,
      eventId: id,
      fileUrl: body.fileUrl,
      status: "DRAFT",
    },
  });
  return apiOk(created, 201);
}
