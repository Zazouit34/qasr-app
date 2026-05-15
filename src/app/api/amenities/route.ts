import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "amenities:read");
  if (deny) return deny;
  const items = await prisma.amenity.findMany({
    where: { venueId: ctx.user.venueId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return apiOk(items);
}

const schema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  isIncluded: z.boolean().optional(),
  extraPrice: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "amenities:create");
  if (deny) return deny;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }
  const row = await prisma.amenity.create({
    data: { venueId: ctx.user.venueId, ...body },
  });
  return apiOk(row, 201);
}
