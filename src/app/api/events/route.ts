import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk, apiError } from "@/lib/api-context";
import { assertCan } from "@/lib/permissions";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { z } from "zod";
import {
  EventStatus,
  EventType,
  PaymentMethod,
  PaymentType,
  ReminderType,
} from "@prisma/client";
import { allocatePaymentNumber, allocateEventNumber } from "@/lib/utils";

function buildWhere(
  venueId: string,
  searchParams: URLSearchParams,
): { AND: object[] } {
  const tab = searchParams.get("tab");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const hallId = searchParams.get("hallId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");
  const now = new Date();

  const parts: object[] = [{ venueId }];

  const dateCond: { gte?: Date; lte?: Date } = {};
  if (from) dateCond.gte = new Date(from);
  if (to) dateCond.lte = new Date(to);
  if (Object.keys(dateCond).length) parts.push({ eventDate: dateCond });

  if (status && status !== "ALL") parts.push({ status: status as EventStatus });
  if (type && type !== "ALL") parts.push({ type: type as EventType });
  if (hallId) parts.push({ hallId });
  if (search) {
    parts.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { eventNumber: { contains: search, mode: "insensitive" } },
        { client: { firstName: { contains: search, mode: "insensitive" } } },
        { client: { lastName: { contains: search, mode: "insensitive" } } },
        { client: { phone: { contains: search } } },
        { client: { phone2: { contains: search } } },
      ],
    });
  }

  if (tab === "week") {
    parts.push({
      eventDate: {
        gte: startOfWeek(now, { weekStartsOn: 1 }),
        lte: endOfWeek(now, { weekStartsOn: 1 }),
      },
    });
  }
  if (tab === "month") {
    parts.push({ eventDate: { gte: startOfMonth(now) } });
    parts.push({ eventDate: { lte: endOfMonth(now) } });
  }
  if (tab === "upcoming") {
    parts.push({ eventDate: { gte: now } });
  }
  if (tab === "completed") parts.push({ status: "COMPLETED" as EventStatus });
  if (tab === "cancelled") parts.push({ status: "CANCELLED" as EventStatus });

  return { AND: parts };
}

export async function GET(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "events:read");
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const where = buildWhere(ctx.user.venueId, searchParams);

  const [rows, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { eventDate: "desc" },
      include: {
        client: true,
        hall: true,
        payments: true,
      },
    }),
    prisma.event.count({ where }),
  ]);

  const data = rows.map((e) => {
    const paid = e.payments
      .filter((p) => p.status === "PAID")
      .reduce((s, p) => s + p.amount, 0);
    return {
      ...e,
      paid,
      balance: e.totalPrice - paid,
    };
  });

  return apiOk({ items: data, total, page, limit });
}

const createSchema = z.object({
  clientId: z.string(),
  hallId: z.string().min(1),
  type: z.nativeEnum(EventType),
  title: z.string().min(1),
  eventDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  guestCount: z.number().int().positive(),
  groomName: z.string().optional().nullable(),
  brideName: z.string().optional().nullable(),
  groomPhone: z.string().optional().nullable(),
  bridePhone: z.string().optional().nullable(),
  basePrice: z.number(),
  totalPrice: z.number(),
  discountAmount: z.number().optional(),
  discountReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  status: z.nativeEnum(EventStatus).optional(),
  serviceLines: z
    .array(
      z.object({
        serviceId: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number(),
        notes: z.string().optional().nullable(),
      }),
    )
    .optional(),
  amenityIds: z.array(z.string()).optional(),
  depositAmount: z.number().optional(),
  depositDueDate: z.string().optional().nullable(),
});

const CHECKLIST_DEFAULT = [
  "Contrat signé",
  "Acompte reçu (30%)",
  "Menu confirmé",
  "Effectif final confirmé (J-7)",
  "Décoration confirmée",
  "DJ / Orchestre confirmé",
  "Solde final réglé (J-3)",
  "Salle préparée",
  "Staff briefé",
];

export async function POST(req: NextRequest) {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;
  const deny = assertCan(ctx.user.role, "events:create");
  if (deny) return deny;

  let parsed: z.infer<typeof createSchema>;
  try {
    parsed = createSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const venueId = ctx.user.venueId;
  const settings = await prisma.venueSettings.findUnique({
    where: { venueId },
  });
  const depositPct = settings?.defaultDepositPct ?? 30;

  const hallsCount = await prisma.hall.count({
    where: { venueId, isActive: true },
  });
  if (hallsCount === 0) {
    return apiError("Ajoutez au moins une salle avant de créer un événement.", 400);
  }

  const eventDate = new Date(parsed.eventDate);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const eventNumber = await allocateEventNumber(tx.event, year);

      const client = await tx.client.findFirst({
        where: { id: parsed.clientId, venueId },
      });
      if (!client) throw new Error("CLIENT_NOT_FOUND");

      const hall = await tx.hall.findFirst({
        where: { id: parsed.hallId, venueId, isActive: true },
      });
      if (!hall) throw new Error("HALL_NOT_FOUND");

      const depositBase = parsed.totalPrice;
      const deposit =
        parsed.depositAmount ??
        Math.round((depositBase * depositPct) / 100 / 1000) * 1000;

      const event = await tx.event.create({
        data: {
          venueId,
          clientId: client.id,
          hallId: hall.id,
          eventNumber,
          type: parsed.type,
          status: parsed.status ?? EventStatus.PENDING,
          title: parsed.title,
          eventDate,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          guestCount: parsed.guestCount,
          groomName: parsed.groomName,
          brideName: parsed.brideName,
          groomPhone: parsed.groomPhone,
          bridePhone: parsed.bridePhone,
          basePrice: parsed.basePrice,
          totalPrice: parsed.totalPrice,
          discountAmount: parsed.discountAmount ?? 0,
          discountReason: parsed.discountReason,
          notes: parsed.notes,
          internalNotes: parsed.internalNotes,
        },
      });

      if (parsed.serviceLines?.length) {
        for (const line of parsed.serviceLines) {
          const svc = await tx.service.findFirst({
            where: { id: line.serviceId, venueId },
          });
          if (!svc) continue;
          const totalPrice = line.quantity * line.unitPrice;
          await tx.eventService.create({
            data: {
              eventId: event.id,
              serviceId: svc.id,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              totalPrice,
            },
          });
        }
      }

      if (parsed.amenityIds?.length) {
        for (const aid of parsed.amenityIds) {
          const am = await tx.amenity.findFirst({
            where: { id: aid, venueId },
          });
          if (am) {
            await tx.eventAmenity.create({
              data: { eventId: event.id, amenityId: am.id },
            });
          }
        }
      }

      let order = 0;
      for (const label of CHECKLIST_DEFAULT) {
        await tx.checklistItem.create({
          data: {
            eventId: event.id,
            label,
            order: order++,
            category: "Mariage",
          },
        });
      }

      const paymentNumber = await allocatePaymentNumber(tx.payment, year);

      const due =
        parsed.depositDueDate != null
          ? new Date(parsed.depositDueDate)
          : eventDate;

      await tx.payment.create({
        data: {
          venueId,
          eventId: event.id,
          paymentNumber,
          amount: deposit,
          type: PaymentType.DEPOSIT,
          method: PaymentMethod.BANK_TRANSFER,
          status: "PENDING",
          dueDate: due,
          recordedBy: ctx.user.id,
        },
      });

      await tx.reminder.createMany({
        data: [
          {
            eventId: event.id,
            type: ReminderType.PAYMENT_DUE,
            message: "Acompte à recevoir",
            dueDate: due,
          },
          {
            eventId: event.id,
            type: ReminderType.CONTRACT_SIGNING,
            message: "Signature du contrat",
            dueDate: eventDate,
          },
        ],
      });

      await tx.activityLog.create({
        data: {
          userId: ctx.user.id,
          action: "EVENT_CREATED",
          entity: "Event",
          entityId: event.id,
          details: { eventNumber },
        },
      });

      return event;
    });

    const full = await prisma.event.findFirst({
      where: { id: result.id, venueId },
      include: {
        client: true,
        hall: true,
        payments: true,
        services: { include: { service: true } },
        amenities: { include: { amenity: true } },
        checklist: true,
        reminders: true,
      },
    });

    return apiOk(full, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    if (msg === "CLIENT_NOT_FOUND") return apiError("Client introuvable", 404);
    if (msg === "HALL_NOT_FOUND") return apiError("Salle introuvable ou inactive.", 404);
    return apiError(msg, 500, e);
  }
}
