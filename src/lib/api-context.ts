import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

export type ApiUser = {
  id: string;
  venueId: string;
  role: Role;
};

export async function requireApiAuth(): Promise<
  { ok: true; user: ApiUser } | { ok: false; response: NextResponse }
> {
  const session = await auth();
  const id = session?.user?.id;
  const venueId = session?.user?.venueId;
  const role = session?.user?.role;
  if (!id || !venueId || !role) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      ),
    };
  }
  return {
    ok: true,
    user: { id, venueId, role: role as Role },
  };
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status },
  );
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
