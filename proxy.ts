import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not configured.");
}

const secretKey = new TextEncoder().encode(secret);

async function getSession(request: NextRequest) {
  const token = request.cookies.get("rentease_session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (
      typeof payload.userId !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await getSession(request);

  /*
   * Protect tenant dashboard
   */
  if (pathname.startsWith("/dashboard/tenant")) {
    if (!session) {
      return NextResponse.redirect(
        new URL("/auth/signin", request.url)
      );
    }

    if (session.role !== "TENANT") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }
  }

  /*
   * Protect landlord dashboard
   */
  if (pathname.startsWith("/dashboard/landlord")) {
    if (!session) {
      return NextResponse.redirect(
        new URL("/auth/signin", request.url)
      );
    }

    if (session.role !== "LANDLORD") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }
  }

  /*
   * Protect admin dashboard
   */
  if (pathname.startsWith("/dashboard/admin")) {
    if (!session) {
      return NextResponse.redirect(
        new URL("/auth/signin", request.url)
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/tenant/:path*",
    "/dashboard/landlord/:path*",
    "/dashboard/admin/:path*",
  ],
};