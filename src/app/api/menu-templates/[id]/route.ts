import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "packages:read");
  if (deny) return deny;
  const { id } = await context.params;

  const tpl = await prisma.menuTemplate.findFirst({
    where: { id, venueId: ctx.user.venueId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      groceryItems: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!tpl) return apiError("Menu introuvable", 404);
  return apiOk(tpl);
}
