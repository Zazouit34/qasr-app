import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "packages:read");
  if (deny) return deny;
  const items = await prisma.package.findMany({
    where: { venueId: ctx.user.venueId },
    include: { items: true },
  });
  return apiOk(items);
}

const schema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  basePrice: z.number(),
  minGuests: z.number().nullable().optional(),
  maxGuests: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  items: z
    .array(z.object({ label: z.string(), isIncluded: z.boolean().optional() }))
    .optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "packages:create");
  if (deny) return deny;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const { items, ...rest } = body;

  const pack = await prisma.package.create({
    data: {
      venueId: ctx.user.venueId,
      ...rest,
      isActive: rest.isActive ?? true,
      items: items?.length
        ? {
            create: items.map((i) => ({
              label: i.label,
              isIncluded: i.isIncluded ?? true,
            })),
          }
        : undefined,
    },
    include: { items: true },
  });
  return apiOk(pack, 201);
}
