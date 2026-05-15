import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;

  const halls = await prisma.hall.findMany({
    where: { venueId: ctx.user.venueId, isActive: true },
    orderBy: { name: "asc" },
  });
  return apiOk(halls);
}

const createHallSchema = z.object({
  name: z.string().trim().min(1),
  capacity: z.number().int().positive(),
  pricePerDay: z.number().nonnegative().nullable().optional(),
  description: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "settings:update");
  if (deny) return deny;

  let body: z.infer<typeof createHallSchema>;
  try {
    body = createHallSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const hall = await prisma.hall.create({
    data: {
      venueId: ctx.user.venueId,
      name: body.name,
      capacity: body.capacity,
      pricePerDay: body.pricePerDay ?? null,
      description: body.description ?? null,
      photos: [],
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: ctx.user.id,
      action: "HALL_CREATED",
      entity: "Hall",
      entityId: hall.id,
      details: { name: hall.name },
    },
  });

  return apiOk(hall, 201);
}
