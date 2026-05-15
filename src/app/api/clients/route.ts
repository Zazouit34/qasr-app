import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "clients:read");
  if (deny) return deny;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? "25")));
  const search = sp.get("search");
  const wilaya = sp.get("wilaya");
  const vip = sp.get("vip");

  const where: Record<string, unknown> = { venueId: ctx.user.venueId };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }
  if (wilaya) where.wilaya = wilaya;
  if (vip === "1" || vip === "true") where.isVIP = true;

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { events: true } },
        events: {
          orderBy: { eventDate: "desc" },
          take: 1,
          select: { eventDate: true, totalPrice: true, status: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  const enriched = await Promise.all(
    items.map(async (c) => {
      const payments = await prisma.payment.findMany({
        where: {
          event: { clientId: c.id, venueId: ctx.user.venueId },
          status: "PAID",
        },
        select: { amount: true },
      });
      const totalSpent = payments.reduce((s, p) => s + p.amount, 0);
      const outstanding = await prisma.payment.aggregate({
        where: {
          event: { clientId: c.id, venueId: ctx.user.venueId },
          status: "PENDING",
        },
        _sum: { amount: true },
      });
      return {
        ...c,
        totalSpent,
        outstanding: outstanding._sum.amount ?? 0,
        lastEvent: c.events[0] ?? null,
      };
    }),
  );

  return apiOk({ items: enriched, total, page, limit });
}

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  phone2: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  wilaya: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional(),
  isVIP: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "clients:create");
  if (deny) return deny;
  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const client = await prisma.client.create({
    data: {
      venueId: ctx.user.venueId,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      phone2: body.phone2,
      email: body.email,
      address: body.address,
      wilaya: body.wilaya,
      nationalId: body.nationalId,
      notes: body.notes,
      isVIP: body.isVIP ?? false,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: ctx.user.id,
      action: "CLIENT_CREATED",
      entity: "Client",
      entityId: client.id,
    },
  });

  return apiOk(client, 201);
}
