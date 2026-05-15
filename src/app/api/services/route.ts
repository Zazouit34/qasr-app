import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";
import { ServiceCategory, PriceType } from "@prisma/client";

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "services:read");
  if (deny) return deny;

  const items = await prisma.service.findMany({
    where: { venueId: ctx.user.venueId },
    orderBy: { name: "asc" },
  });
  return apiOk(items);
}

const bodySchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number(),
  priceType: z.nativeEnum(PriceType).optional(),
  unit: z.string().optional().nullable(),
  category: z.nativeEnum(ServiceCategory),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "services:create");
  if (deny) return deny;
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const row = await prisma.service.create({
    data: {
      venueId: ctx.user.venueId,
      ...body,
      priceType: body.priceType ?? "FIXED",
      isActive: body.isActive ?? true,
    },
  });
  return apiOk(row, 201);
}
