import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth/authorization";

export async function POST(request: Request) {
  try {
    // 1. Make sure the user is a logged-in landlord
    const { user, error } = await requireRole(["LANDLORD"]);

    if (error === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Only landlords can create properties." },
        { status: 403 }
      );
    }

    // 2. Read request body
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
    } = body;

    // 3. Validate required fields
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
    {
      error: "All required property fields must be provided.",
    },
    { status: 400 }
  );
}

// 4. Normalize text fields
const normalizedTitle = title.trim();
const normalizedDescription = description.trim();
const normalizedType = type.trim();
const normalizedCity = city.trim();
const normalizedLocality = locality.trim();
const normalizedFurnishing = furnishing.trim();

// 5. Validate text fields
if (
  !normalizedTitle ||
  !normalizedDescription ||
  !normalizedType ||
  !normalizedCity ||
  !normalizedLocality ||
  !normalizedFurnishing
) {
  return NextResponse.json(
    {
      error: "Property text fields cannot be empty.",
    },
    { status: 400 }
  );
}


  // 6. Validate numeric values
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
    {
      error: "Invalid property numeric values.",
    },
    { status: 400 }
  );
}

// 7. Validate optional coordinates
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
    {
      error: "Invalid location coordinates.",
    },
    { status: 400 }
  );
}
    // 6. Create property
    const property = await prisma.property.create({
     data: {
  ownerId: user.id,

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

  status: typeof body.status === "string" && body.status ? body.status : "PUBLISHED",
},
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        type: true,
        city: true,
        locality: true,
        latitude: true,
        longitude: true,
        rent: true,
        area: true,
        bedrooms: true,
        bathrooms: true,
        furnishing: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 7. Return created property
    return NextResponse.json(
      {
        message: "Property created successfully.",
        property,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create property error:", error);

    return NextResponse.json(
      {
        error: "Unable to create property.",
      },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      where: {
        status: { in: ["PUBLISHED", "DRAFT"] },
      },
      orderBy : {
        createdAt : "desc"
      },
      include : {
        images : {
          orderBy : {
            sortOrder : "asc"
          }
        },
        owner : {
          select : {
            id : true,
            name : true,
            createdAt : true
          }
        }
      }
    });

        const formattedProperties = properties.map((property) => ({
      id: property.id,
      title: property.title,
      description: property.description,
      type: property.type,
      city: property.city,
      locality: property.locality,
      latitude: property.latitude,
      longitude: property.longitude,
      rent: typeof property.rent === "object" && property.rent && "toNumber" in property.rent
        ? property.rent.toNumber()
        : Number(property.rent),
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      furnishing: property.furnishing,
      status: property.status,

      images: property.images.map((image) => ({
        id: image.id,
        url: image.url,
        storageKey: image.storageKey,
        sortOrder: image.sortOrder,
      })),

      owner: {
        id: property.owner.id,
        name: property.owner.name,
        createdAt: property.owner.createdAt,
      },

      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    }));

    return NextResponse.json({
      properties: formattedProperties,
    });
  } catch (error) {
    console.error("Fetch properties error:", error);

    return NextResponse.json(
      { message: "Unable to fetch properties." },
      { status: 500 }
    );
  }
}