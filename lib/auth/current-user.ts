import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get("rentease_session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}