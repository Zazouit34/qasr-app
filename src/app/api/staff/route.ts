import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "staff:read");
  if (deny) return deny;
  const items = await prisma.staffMember.findMany({
    where: { venueId: ctx.user.venueId },
    include: {
      assignments: {
        include: {
          event: {
            select: { id: true, title: true, eventDate: true, eventNumber: true },
          },
        },
      },
    },
  });
  return apiOk(items);
}

const schema = z.object({
  name: z.string().min(1),
  role: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  salary: z.number().nullable().optional(),
  joinDate: z.string(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "staff:create");
  if (deny) return deny;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const row = await prisma.staffMember.create({
    data: {
      venueId: ctx.user.venueId,
      name: body.name,
      role: body.role,
      phone: body.phone,
      email: body.email,
      salary: body.salary,
      joinDate: new Date(body.joinDate),
      isActive: body.isActive ?? true,
      notes: body.notes,
    },
  });
  return apiOk(row, 201);
}
