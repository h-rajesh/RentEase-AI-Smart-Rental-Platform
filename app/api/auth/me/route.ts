import { verifySession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("rentease_session")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const session = await verifySession(token);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch current user session:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json(
      { message: "Signed out successfully" },
      { status: 200 }
    );

    response.cookies.delete("rentease_session");

    return response;
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { error: "Unable to sign out" },
      { status: 500 }
    );
  }
}
