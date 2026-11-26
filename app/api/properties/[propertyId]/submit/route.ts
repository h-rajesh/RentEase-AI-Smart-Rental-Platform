
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    propertyId: string;
  }>;
};

const TRUST_SCORE_THRESHOLD = 75;

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    // 1. Authenticate landlord
    const { user, error } = await requireRole(["LANDLORD"]);

    if (error === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (error === "FORBIDDEN" || !user) {
      return NextResponse.json(
        { error: "Only landlords can submit properties." },
        { status: 403 },
      );
    }

    // 2. Get property ID
    const { propertyId } = await context.params;

    // 3. Verify ownership and retrieve property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: user.id,
      },
      include: {
        assessments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 },
      );
    }

    // 4. Only draft properties can be submitted
    if (property.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft properties can be submitted." },
        { status: 409 },
      );
    }

    // 5. Check whether an assessment exists
    const latestAssessment = property.assessments[0];

    if (!latestAssessment) {
      return NextResponse.json(
        {
          error: "Complete the Trust Score assessment before submitting.",
        },
        { status: 400 },
      );
    }

    // 6. Reject outdated assessments
    if (
      latestAssessment.propertyUpdatedAt.getTime() !==
      property.updatedAt.getTime()
    ) {
      return NextResponse.json(
        {
          error: "Your property has changed since its last assessment. Reassess it before submitting.",
        },
        { status: 409 },
      );
    }

    // 7. Enforce the minimum Trust Score
    if (latestAssessment.trustScore < TRUST_SCORE_THRESHOLD) {
      return NextResponse.json(
        {
          error: `Your Trust Score must be at least ${TRUST_SCORE_THRESHOLD}/100 to submit.`,
          trustScore: latestAssessment.trustScore,
          threshold: TRUST_SCORE_THRESHOLD,
        },
        { status: 403 },
      );
    }

    // 8. Submit without publishing
    const result = await prisma.property.updateMany({
      where: {
        id: property.id,
        ownerId: user.id,
        status: "DRAFT",
        updatedAt: property.updatedAt,
      },
      data: {
        status: "SUBMITTED",

        // A status transition must not invalidate the property assessment.
        updatedAt: property.updatedAt,
      },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        {
          error: "The property changed during submission. Please reassess and try again.",
        },
        { status: 409 },
      );
    }

    // 9. Return submission result
    return NextResponse.json({
      message: "Property submitted successfully for Admin review.",
      property: {
        id: property.id,
        status: "SUBMITTED",
      },
      assessment: {
        trustScore: latestAssessment.trustScore,
        threshold: TRUST_SCORE_THRESHOLD,
        listedRentOutsideRange:
          latestAssessment.listedRentOutsideRange,
        requiresAdminPriceReview:
          latestAssessment.listedRentOutsideRange,
      },
    });
  } catch (error) {
    console.error("Property submission error:", error);

    return NextResponse.json(
      { error: "Unable to submit property." },
      { status: 500 },
    );
  }
}
