
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorization";
import {
  PropertyStatus,
  Role,
} from "@/lib/generated/prisma/client";

interface RouteContext {
  params: Promise<{ propertyId: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
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

    const { propertyId } = await params;

    let body: {
      action?: string;
      reason?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const action = body.action;
    const reason = body.reason?.trim() ?? "";

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Action must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    if (action === "REJECT" && reason.length < 10) {
      return NextResponse.json(
        { error: "Provide a rejection reason of at least 10 characters." },
        { status: 400 }
      );
    }

    if (reason.length > 1000) {
      return NextResponse.json(
        { error: "Rejection reason cannot exceed 1000 characters." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: propertyId },
        include: {
          assessments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!property) {
        return {
          error: "Property not found.",
          httpStatus: 404,
        };
      }

      if (property.status !== PropertyStatus.SUBMITTED) {
        return {
          error: "This property is no longer awaiting review.",
          httpStatus: 422,
        };
      }

      if (action === "APPROVE") {
        const assessment = property.assessments[0];

        if (
          !assessment ||
          assessment.propertyUpdatedAt.getTime() !==
            property.updatedAt.getTime()
        ) {
          return {
            error:
              "The property has no current assessment. It must be reassessed before approval.",
            status: 409,
          };
        }

        if (assessment.trustScore < 75) {
          return {
            error:
              "Property Trust Score is below the minimum approval threshold of 75.",
            status: 422,
          };
        }
      }

      const newStatus =
        action === "APPROVE"
          ? PropertyStatus.PUBLISHED
          : PropertyStatus.REJECTED;

      const update = await tx.property.updateMany({
        where: {
          id: propertyId,
          status: PropertyStatus.SUBMITTED,
          updatedAt: property.updatedAt,
        },
        data: {
          status: newStatus,
          rejectionReason: action === "REJECT" ? reason : null,
        },
      });

      if (update.count !== 1) {
        return {
          error:
            "The property changed during review. Refresh and try again.",
          status: 409,
        };
      }

      return {
        propertyId,
        status: newStatus,
        rejectionReason: action === "REJECT" ? reason : null,
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json({
      message:
        action === "APPROVE"
          ? "Property approved and published successfully."
          : "Property rejected successfully.",
      property: result,
    });
  } catch (error) {
    console.error("Admin property decision error:", error);

    return NextResponse.json(
      { error: "Unable to process property decision." },
      { status: 500 }
    );
  }
}
