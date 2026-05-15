import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

const PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  VENUE_ADMIN: [
    "events:*",
    "clients:*",
    "payments:*",
    "services:*",
    "amenities:*",
    "packages:*",
    "quotes:*",
    "staff:*",
    "expenses:*",
    "reports:read",
    "settings:*",
  ],
  STAFF: [
    "events:read",
    "events:create",
    "events:update",
    "clients:read",
    "clients:create",
    "clients:update",
    "payments:read",
    "payments:create",
    "quotes:read",
    "quotes:create",
    "quotes:update",
    "staff:read",
    "services:read",
    "amenities:read",
    "packages:read",
    "calendar:read",
  ],
  ACCOUNTANT: [
    "payments:*",
    "expenses:*",
    "reports:read",
    "events:read",
    "clients:read",
    "quotes:read",
  ],
};

function matchPattern(granted: string, action: string): boolean {
  if (granted === "*") return true;
  const [gRes, gOp] = granted.split(":");
  const [aRes, aOp] = action.split(":");
  if (gRes !== aRes) return false;
  if (gOp === "*") return true;
  return gOp === aOp;
}

export function can(role: Role, action: string): boolean {
  const list = PERMISSIONS[role] ?? [];
  return list.some((g) => matchPattern(g, action));
}

export function assertCan(role: Role, action: string): NextResponse | null {
  if (!can(role, action)) {
    return NextResponse.json(
      { success: false, error: "Interdit" },
      { status: 403 },
    );
  }
  return null;
}
