import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const postSchema = z.object({
  staffMemberId: z.string(),
  role: z.string().min(1),
  notes: z.string().nullable().optional(),
});

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
    select: { id: true },
  });
  if (!event) return apiError("Événement introuvable", 404);

  const rows = await prisma.eventAssignment.findMany({
    where: { eventId: id },
    include: { staffMember: true },
    orderBy: { role: "asc" },
  });
  return apiOk(rows);
}

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

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const event = await prisma.event.findFirst({
    where: { id, venueId },
  });
  if (!event) return apiError("Événement introuvable", 404);

  const staff = await prisma.staffMember.findFirst({
    where: { id: body.staffMemberId, venueId, isActive: true },
  });
  if (!staff) return apiError("Membre du staff introuvable", 404);

  const row = await prisma.eventAssignment.create({
    data: {
      eventId: id,
      staffMemberId: staff.id,
      role: body.role,
      notes: body.notes ?? null,
    },
    include: { staffMember: true },
  });
  return apiOk(row, 201);
}
