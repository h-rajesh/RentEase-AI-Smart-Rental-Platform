import { getCurrentUser } from "@/lib/auth/current-user";
import { Role } from "@/lib/generated/prisma/client";

export async function requireRole(allowedRoles: Role[]) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: "UNAUTHORIZED" as const,
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: "FORBIDDEN" as const,
    };
  }

  return {
    user,
    error: null,
  };
}