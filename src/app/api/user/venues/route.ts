import prisma from "@/lib/prisma";
import { requireApiAuth, apiOk } from "@/lib/api-context";

export async function GET() {
  const ctx = await requireApiAuth();
  if (!ctx.ok) return ctx.response;

  const links = await prisma.userVenue.findMany({
    where: { userId: ctx.user.id },
    include: { venue: { select: { id: true, name: true, slug: true } } },
    orderBy: { venue: { name: "asc" } },
  });

  if (links.length > 0) {
    const items = links.map((l) => ({
      id: l.venue.id,
      name: l.venue.name,
      slug: l.venue.slug,
      isActive: l.venueId === ctx.user.venueId,
    }));
    return apiOk({ items });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: ctx.user.venueId },
    select: { id: true, name: true, slug: true },
  });
  return apiOk({
    items: venue ? [{ id: venue.id, name: venue.name, slug: venue.slug, isActive: true }] : [],
  });
}
