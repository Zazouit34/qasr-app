import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: Role;
    venueId?: string;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      venueId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    venueId?: string;
  }
}
