import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "expenses:read");
  if (deny) return deny;

  const month = req.nextUrl.searchParams.get("month");
  const category = req.nextUrl.searchParams.get("category");
  const eventId = req.nextUrl.searchParams.get("eventId");

  const where: Record<string, unknown> = { venueId: ctx.user.venueId };
  if (category) where.category = category as ExpenseCategory;
  if (eventId) where.eventId = eventId;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }

  const items = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: 500,
  });
  const monthly = await prisma.expense.aggregate({
    where: {
      venueId: ctx.user.venueId,
      ...(month
        ? (() => {
            const [y, m] = month.split("-").map(Number);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0, 23, 59, 59);
            return { date: { gte: start, lte: end } };
          })()
        : {}),
    },
    _sum: { amount: true },
  });

  return apiOk({ items, monthTotal: monthly._sum.amount ?? 0 });
}

const schema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1),
  amount: z.number(),
  date: z.string(),
  vendor: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  eventId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "expenses:create");
  if (deny) return deny;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  if (body.eventId) {
    const evt = await prisma.event.findFirst({
      where: { id: body.eventId, venueId: ctx.user.venueId },
    });
    if (!evt) return apiError("Événement introuvable", 404);
  }

  const row = await prisma.expense.create({
    data: {
      venueId: ctx.user.venueId,
      category: body.category,
      description: body.description,
      amount: body.amount,
      date: new Date(body.date),
      vendor: body.vendor,
      receiptUrl: body.receiptUrl,
      notes: body.notes,
      eventId: body.eventId ?? null,
    },
  });
  return apiOk(row, 201);
}
