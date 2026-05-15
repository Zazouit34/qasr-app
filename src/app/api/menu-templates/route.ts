import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  basePrice: z.number().optional(),
  sortOrder: z.number().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        qty: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .default([]),
  groceryLines: z
    .array(
      z.object({
        ingredient: z.string(),
        approxQty: z.string().nullable().optional(),
        unit: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .optional(),
});

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "packages:read");
  if (deny) return deny;

  const items = await prisma.menuTemplate.findMany({
    where: { venueId: ctx.user.venueId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { items: { orderBy: { sortOrder: "asc" } }, groceryItems: { orderBy: { sortOrder: "asc" } } },
  });
  return apiOk(items);
}

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "settings:update");
  if (deny) return deny;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const venueId = ctx.user.venueId;
  const { items, groceryLines, ...rest } = body;

  const tpl = await prisma.menuTemplate.create({
    data: {
      venueId,
      name: rest.name,
      description: rest.description ?? null,
      basePrice: rest.basePrice ?? null,
      sortOrder: rest.sortOrder ?? 0,
      items: items.length
        ? {
            create: items.map((i, idx) => ({
              label: i.label,
              qty: i.qty ?? null,
              notes: i.notes ?? null,
              sortOrder: i.sortOrder ?? idx,
            })),
          }
        : undefined,
      groceryItems:
        groceryLines?.length ?
          {
            create: groceryLines.map((g, idx) => ({
              ingredient: g.ingredient,
              approxQty: g.approxQty ?? null,
              unit: g.unit ?? null,
              note: g.note ?? null,
              sortOrder: g.sortOrder ?? idx,
            })),
          }
        : undefined,
    },
    include: {
      items: true,
      groceryItems: true,
    },
  });

  return apiOk(tpl, 201);
}
