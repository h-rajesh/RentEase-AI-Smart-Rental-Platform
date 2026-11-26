
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorization";

export async function GET() {
  try {
    const { user, error } = await requireRole(["LANDLORD"]);

    if (error === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error === "FORBIDDEN" || !user) {
      return NextResponse.json(
        { error: "Only landlords can access these properties." },
        { status: 403 }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        ownerId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
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

    const formattedProperties = properties.map((property) => ({
      id: property.id,
      title: property.title,
      description: property.description,
      type: property.type,
      city: property.city,
      locality: property.locality,
      rent: Number(property.rent),
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      furnishing: property.furnishing,
      amenities: property.amenities,
      status: property.status,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,

      images: property.images.map((image) => ({
        id: image.id,
        url: image.url,
        sortOrder: image.sortOrder,
      })),

      latestAssessment: property.assessments[0]
        ? {
            trustScore: property.assessments[0].trustScore,
            signals: property.assessments[0].signals,
            estimatedRentLow: Number(
              property.assessments[0].estimatedRentLow
            ),
            estimatedRentMid: Number(
              property.assessments[0].estimatedRentMid
            ),
            estimatedRentHigh: Number(
              property.assessments[0].estimatedRentHigh
            ),
            listedRentOutsideRange:
              property.assessments[0].listedRentOutsideRange,
            propertyUpdatedAt:
              property.assessments[0].propertyUpdatedAt,
            createdAt:
              property.assessments[0].createdAt,
          }
        : null,
    }));

    return NextResponse.json(
      { properties: formattedProperties },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch landlord properties error:", error);

    return NextResponse.json(
      { error: "Unable to fetch your properties." },
      { status: 500 }
    );
  }
}
