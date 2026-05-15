import type { ComponentProps } from "react";
import Badge from "@/components/ui/badge/Badge";

type BadgeColorProp = ComponentProps<typeof Badge>["color"];

/** Maps Prisma PaymentStatus → TailAdmin Badge colors (aligned with Badge demo). */
export function paymentStatusBadgeColor(status: string): BadgeColorProp {
  switch (status) {
    case "PAID":
      return "success";
    case "PENDING":
      return "warning";
    case "OVERDUE":
      return "error";
    case "CANCELLED":
      return "dark";
    case "REFUNDED":
      return "info";
    default:
      return "light";
  }
}
