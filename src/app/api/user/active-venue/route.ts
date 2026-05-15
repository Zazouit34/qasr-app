import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { z } from "zod";

const bodySchema = z.object({
  venueId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const link = await prisma.userVenue.findUnique({
    where: {
      userId_venueId: { userId: ctx.user.id, venueId: body.venueId },
    },
  });
  const membershipCount = await prisma.userVenue.count({
    where: { userId: ctx.user.id },
  });

  const allowedFallback =
    membershipCount === 0 && body.venueId === ctx.user.venueId;

  if (!link && !allowedFallback) {
    return apiError("Accès au lieu non autorisé.", 403);
  }

  await prisma.user.update({
    where: { id: ctx.user.id },
    data: { venueId: body.venueId },
  });

  return apiOk({ venueId: body.venueId });
}
