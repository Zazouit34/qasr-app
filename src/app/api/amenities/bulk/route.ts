import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";
import { AMENITY_PRESETS } from "@/lib/onboarding-presets";

const schema = z.object({
  presetKeys: z.array(z.string()).min(1),
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

  const venueId = ctx.user.venueId;
  const created = [];

  let order = await prisma.amenity.count({ where: { venueId } });

  for (const key of body.presetKeys) {
    const preset = AMENITY_PRESETS.find((p) => p.key === key);
    if (!preset) continue;
    const dup = await prisma.amenity.findFirst({
      where: { venueId, name: preset.name },
    });
    if (dup) continue;
    order += 1;
    const row = await prisma.amenity.create({
      data: {
        venueId,
        name: preset.name,
        nameAr: preset.nameAr ?? null,
        isIncluded: true,
        sortOrder: order,
      },
    });
    created.push(row);
  }

  return apiOk({ created, count: created.length }, 201);
}
