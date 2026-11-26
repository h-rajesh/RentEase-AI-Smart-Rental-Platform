
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorization";
import { Role } from "@/lib/generated/prisma/client";

export async function GET() {
  try {
    const { user, error } = await requireRole([Role.ADMIN]);

    if (error || !user) {
      return NextResponse.json(
        {
          error:
            error === "UNAUTHORIZED"
              ? "Authentication required."
              : "Admin access required.",
        },
        { status: error === "UNAUTHORIZED" ? 401 : 403 }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        status: "SUBMITTED",
      },
      orderBy: {
        updatedAt: "asc",
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        assessments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      properties,
      count: properties.length,
    });
  } catch (error) {
    console.error("Admin properties GET error:", error);

    return NextResponse.json(
      { error: "Unable to fetch submitted properties." },
      { status: 500 }
    );
  }
}
