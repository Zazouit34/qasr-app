import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";
import { SERVICE_PRESETS } from "@/lib/onboarding-presets";

const bodySchema = z.object({
  presetKeys: z.array(z.string()).min(1),
  priceOverrides: z.record(z.string(), z.number()).optional(),
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

  const venueId = ctx.user.venueId;
  const created = [];

  for (const key of body.presetKeys) {
    const preset = SERVICE_PRESETS.find((p) => p.key === key);
    if (!preset) continue;
    const dup = await prisma.service.findFirst({
      where: { venueId, name: preset.name },
    });
    if (dup) continue;
    const price = body.priceOverrides?.[key] ?? preset.suggestedPrice;
    const row = await prisma.service.create({
      data: {
        venueId,
        name: preset.name,
        nameAr: preset.nameAr,
        category: preset.category,
        price,
        unit: preset.unit ?? null,
        description: null,
      },
    });
    created.push(row);
  }

  return apiOk({ created, count: created.length }, 201);
}
