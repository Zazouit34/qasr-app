import { differenceInDays, format } from "date-fns";
import type { Payment, PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export function formatDZD(amount: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy 'à' HH:mm");
}

export async function generateEventNumber(venueId: string): Promise<string> {
  void venueId;
  const year = new Date().getFullYear();
  return allocateEventNumber(prisma.event, year);
}

/** Globally unique EVT-{year}-{nnnn} — same reasoning as payments. */
export async function allocateEventNumber(
  eventDelegate: typeof prisma.event,
  year: number,
): Promise<string> {
  const prefix = `EVT-${year}-`;
  const last = await eventDelegate.findFirst({
    where: { eventNumber: { startsWith: prefix } },
    orderBy: { eventNumber: "desc" },
    select: { eventNumber: true },
  });

  let next = 1;
  if (last?.eventNumber?.startsWith(prefix)) {
    const suffix = last.eventNumber.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }

  if (next > 9999) {
    throw new Error("Event number sequence exhausted for this year");
  }

  return `${prefix}${String(next).padStart(4, "0")}`;
}

/**
 * Next PAY-{year}-{nnnn} using the lexicographically greatest existing key for that year.
 * paymentNumber is globally unique in the schema — must not scope only by venueId.
 */
export async function allocatePaymentNumber(
  paymentDelegate: typeof prisma.payment,
  year: number,
): Promise<string> {
  const prefix = `PAY-${year}-`;
  const last = await paymentDelegate.findFirst({
    where: { paymentNumber: { startsWith: prefix } },
    orderBy: { paymentNumber: "desc" },
    select: { paymentNumber: true },
  });

  let next = 1;
  if (last?.paymentNumber?.startsWith(prefix)) {
    const suffix = last.paymentNumber.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }

  if (next > 9999) {
    throw new Error("Payment number sequence exhausted for this year");
  }

  return `${prefix}${String(next).padStart(4, "0")}`;
}

/** Back-compat wrapper — venueId ignored because numbers are globally unique. */
export async function generatePaymentNumber(venueId: string): Promise<string> {
  void venueId;
  const year = new Date().getFullYear();
  return allocatePaymentNumber(prisma.payment, year);
}

export function derivePaymentStatus(payment: Payment): PaymentStatus {
  if (payment.status === "PAID" || payment.status === "CANCELLED" || payment.status === "REFUNDED") {
    return payment.status;
  }
  if (payment.dueDate && new Date(payment.dueDate) < new Date() && payment.status === "PENDING") {
    return "OVERDUE";
  }
  return payment.status;
}

export function daysUntilEvent(eventDate: Date | string): number {
  return differenceInDays(new Date(eventDate), new Date());
}

/** Next DEV-{year}-{nnnn} globally unique quote numbers. */
export async function allocateQuoteNumber(
  quoteDelegate: typeof prisma.quote,
  year: number,
): Promise<string> {
  const prefix = `DEV-${year}-`;
  const last = await quoteDelegate.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: "desc" },
    select: { quoteNumber: true },
  });
  let next = 1;
  if (last?.quoteNumber?.startsWith(prefix)) {
    const suffix = last.quoteNumber.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }
  if (next > 9999) throw new Error("Quote sequence exhausted");
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  return allocateQuoteNumber(prisma.quote, year);
}
