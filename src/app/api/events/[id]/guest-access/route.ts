import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";

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

  const event = await prisma.event.findFirst({
    where: { id, venueId },
  });
  if (!event) return apiError("Événement introuvable", 404);

  let expiresInDays = 365;
  try {
    const j = (await req.json()) as { expiresInDays?: number };
    if (typeof j.expiresInDays === "number" && j.expiresInDays > 0 && j.expiresInDays < 365 * 5) {
      expiresInDays = j.expiresInDays;
    }
  } catch {
    /* optional body */
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await prisma.eventGuestAccess.upsert({
    where: { eventId: event.id },
    create: {
      eventId: event.id,
      token,
      expiresAt,
    },
    update: {
      token,
      expiresAt,
    },
  });

  return apiOk({
    token,
    path: `/p/${token}`,
  });
}
