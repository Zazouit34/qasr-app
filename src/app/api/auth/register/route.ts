import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api-context";
import { z } from "zod";

function slugBase(name: string) {
  const s = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
  return s || "venue";
}

async function uniqueSlug(base: string) {
  let candidate = base;
  for (let i = 0; i < 8; i++) {
    const taken = await prisma.venue.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

const registerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8),
  venueName: z.string().trim().min(2),
  city: z.string().trim().min(1),
  wilaya: z.string().trim().min(1),
  venuePhone: z.string().trim().min(6),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof registerSchema>;
  try {
    body = registerSchema.parse(await req.json());
  } catch (e) {
    return apiError("Données invalides", 400, e);
  }

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) return apiError("Un compte existe déjà avec cet e-mail.", 409);

  const slug = await uniqueSlug(slugBase(body.venueName));
  const pwHash = await bcrypt.hash(body.password, 10);
  const address = `${body.city} — À compléter`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const venue = await tx.venue.create({
        data: {
          name: body.venueName,
          slug,
          address,
          city: body.city,
          wilaya: body.wilaya,
          phone: body.venuePhone,
          email: body.email,
          capacity: 200,
          description: "Configuration initiale du lieu.",
        },
      });
      await tx.venueSettings.create({
        data: { venueId: venue.id },
      });
      const user = await tx.user.create({
        data: {
          name: `${body.firstName} ${body.lastName}`,
          email: body.email,
          password: pwHash,
          role: "VENUE_ADMIN",
          venueId: venue.id,
          isActive: true,
        },
        select: { id: true, email: true, name: true },
      });
      await tx.userVenue.create({
        data: { userId: user.id, venueId: venue.id },
      });
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "VENUE_REGISTERED",
          entity: "Venue",
          entityId: venue.id,
          details: { venueName: body.venueName },
        },
      });
      return { user, venueId: venue.id };
    });

    return apiOk({ user: result.user, venueId: result.venueId }, 201);
  } catch {
    return apiError("Impossible de créer le compte. Réessayez.", 500);
  }
}
