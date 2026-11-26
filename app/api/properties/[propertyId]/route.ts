
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorization";

type RouteContext = {
  params: Promise<{
    propertyId: string;
  }>;
};

export async function PUT(
  request: Request,
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
        { error: "Only landlords can update properties." },
        { status: 403 },
      );
    }

    // 2. Get property ID
    const { propertyId } = await context.params;

    // 3. Verify ownership and draft status
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: user.id,
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 },
      );
    }

    if (existingProperty.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft properties can be edited." },
        { status: 409 },
      );
    }

    // 4. Read request body
    const body = await request.json();

    const {
      title,
      description,
      type,
      city,
      locality,
      latitude,
      longitude,
      rent,
      area,
      bedrooms,
      bathrooms,
      furnishing,
      amenities,
    } = body;

    // 5. Validate required fields
    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof type !== "string" ||
      typeof city !== "string" ||
      typeof locality !== "string" ||
      typeof furnishing !== "string" ||
      rent === undefined ||
      area === undefined ||
      bedrooms === undefined ||
      bathrooms === undefined
    ) {
      return NextResponse.json(
        { error: "All required property fields must be provided." },
        { status: 400 },
      );
    }

    // 6. Normalize text
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedType = type.trim();
    const normalizedCity = city.trim();
    const normalizedLocality = locality.trim();
    const normalizedFurnishing = furnishing.trim();

    if (
      !normalizedTitle ||
      !normalizedDescription ||
      !normalizedType ||
      !normalizedCity ||
      !normalizedLocality ||
      !normalizedFurnishing
    ) {
      return NextResponse.json(
        { error: "Property text fields cannot be empty." },
        { status: 400 },
      );
    }

    // 7. Validate numeric values
    const numericRent = Number(rent);
    const numericArea = Number(area);
    const numericBedrooms = Number(bedrooms);
    const numericBathrooms = Number(bathrooms);

    if (
      !Number.isFinite(numericRent) ||
      numericRent <= 0 ||
      numericRent > 10000000 ||
      !Number.isFinite(numericArea) ||
      numericArea <= 0 ||
      numericArea > 1000000 ||
      !Number.isInteger(numericBedrooms) ||
      numericBedrooms < 0 ||
      numericBedrooms > 20 ||
      !Number.isInteger(numericBathrooms) ||
      numericBathrooms < 0 ||
      numericBathrooms > 20
    ) {
      return NextResponse.json(
        { error: "Invalid property numeric values." },
        { status: 400 },
      );
    }

    // 8. Validate amenities
    if (
      !Array.isArray(amenities) ||
      !amenities.every((item) => typeof item === "string")
    ) {
      return NextResponse.json(
        { error: "Invalid property amenities." },
        { status: 400 },
      );
    }

    const normalizedAmenities = [
      ...new Set(
        amenities
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0),
      ),
    ];

    // 9. Validate optional coordinates
    const numericLatitude =
      latitude !== undefined && latitude !== null
        ? Number(latitude)
        : null;

    const numericLongitude =
      longitude !== undefined && longitude !== null
        ? Number(longitude)
        : null;

    if (
      (numericLatitude !== null &&
        (!Number.isFinite(numericLatitude) ||
          numericLatitude < -90 ||
          numericLatitude > 90)) ||
      (numericLongitude !== null &&
        (!Number.isFinite(numericLongitude) ||
          numericLongitude < -180 ||
          numericLongitude > 180))
    ) {
      return NextResponse.json(
        { error: "Invalid location coordinates." },
        { status: 400 },
      );
    }

    // 10. Update only if the property is still a draft
    const result = await prisma.property.updateMany({
      where: {
        id: propertyId,
        ownerId: user.id,
        status: "DRAFT",
        updatedAt: existingProperty.updatedAt,
      },
      data: {
        title: normalizedTitle,
        description: normalizedDescription,
        type: normalizedType,
        city: normalizedCity,
        locality: normalizedLocality,
        latitude: numericLatitude,
        longitude: numericLongitude,
        rent: numericRent,
        area: numericArea,
        bedrooms: numericBedrooms,
        bathrooms: numericBathrooms,
        furnishing: normalizedFurnishing,
        amenities: normalizedAmenities,
      },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        { error: "Property changed during editing. Please refresh and try again." },
        { status: 409 },
      );
    }

    const updatedProperty = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Draft property updated successfully.",
      property: updatedProperty,
    });
  } catch (error) {
    console.error("Update property error:", error);

    return NextResponse.json(
      { error: "Unable to update property." },
      { status: 500 },
    );
  }
}


export async function GET(
  request : Request,
  context : RouteContext,
) {
  try {
    const { user,error } = await requireRole(["LANDLORD"]);

    if(error === "UNAUTHORIZED"){
      return NextResponse.json(
        {error : "Authentication Required"},
        {status : 401},
      )
    }

    if(error === "FORBIDDEN" || !user){
      return NextResponse.json(
        {error : "Only landlords can access this property"},
        {status : 403}
      )
    }

    const {propertyId} = await context.params;
    
    const property = await prisma.property.findFirst({
      where : {
        id : propertyId,
        ownerId : user.id,
      },
      include : {
        images : {
          orderBy : {
            sortOrder : "asc",
          },
        },
        assessments : {
          orderBy : {
            createdAt : "desc",
          },
          take : 1,
        },
      },
    });
    if(!property){
      return NextResponse.json(
        {error : "Property not found"},
        {status : 404}
      );
    }
    const assessment = property.assessments[0] ?? null;

    return NextResponse.json({
      property: {
        id: property.id,
        title: property.title,
        description: property.description,
        type: property.type,
        city: property.city,
        locality: property.locality,
        latitude: property.latitude,
        longitude: property.longitude,
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

        latestAssessment: assessment
          ? {
              trustScore: assessment.trustScore,
              signals: assessment.signals,
              estimatedRentLow: Number(assessment.estimatedRentLow),
              estimatedRentMid: Number(assessment.estimatedRentMid),
              estimatedRentHigh: Number(assessment.estimatedRentHigh),
              listedRentOutsideRange:
                assessment.listedRentOutsideRange,
              propertyUpdatedAt: assessment.propertyUpdatedAt,
              createdAt: assessment.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Fetch landlord property error:",error);

    return NextResponse.json(
      {error : "Unable to fetch property details."},
      {status : 500}
    )
    
  }
}