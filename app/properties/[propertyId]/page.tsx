import type { Metadata } from "next";
import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import { formatINR, PROPERTIES } from "@/lib/rentease-data";
import { adaptApiProperty } from "@/lib/rentease-property-adapter";

import PropertyDetailClient from "@/app/properties/[propertyId]/PropertyDetailClient";

interface PropertyPageProps {
  params: Promise<{
    propertyId: string;
  }>;
}

async function getProperty(propertyId: string) {
  try {
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        status: "PUBLISHED",
      },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (property) {
      return {
        id: property.id,
        title: property.title,
        description: property.description,
        type: property.type,
        city: property.city,
        locality: property.locality,
        latitude: property.latitude,
        longitude: property.longitude,
        rent:
          typeof property.rent === "object" &&
          property.rent &&
          "toNumber" in property.rent
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
          id: property.owner?.id ?? "unknown",
          name: property.owner?.name ?? "Landlord",
          createdAt: property.owner?.createdAt ?? new Date().toISOString(),
        },

        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      };
    }
  } catch (err) {
    console.error("Error fetching property from DB (checking fallback):", err);
  }

  const mock = PROPERTIES.find((p) => p.id === propertyId);
  if (mock) {
    return {
      id: mock.id,
      title: mock.name,
      description: mock.description,
      type: mock.type,
      city: mock.city,
      locality: mock.locality,
      latitude: null,
      longitude: null,
      rent: mock.rent,
      area: mock.area,
      bedrooms: mock.beds,
      bathrooms: mock.baths,
      furnishing: mock.furnishing,
      status: "PUBLISHED",
      images: mock.images.map((img, i) => ({
        id: `${mock.id}-img-${i}`,
        url: typeof img === "string" ? img : img.src,
        storageKey: null,
        sortOrder: i,
      })),
      owner: {
        id: "landlord-1",
        name: mock.landlord.name,
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { propertyId } = await params;

  const apiProperty = await getProperty(propertyId);

  if (!apiProperty) {
    return {
      title: "Listing unavailable — RentEase",
      robots: {
        index: false,
      },
    };
  }

  const property = adaptApiProperty(apiProperty);

  const title = `${property.name}, ${property.locality} — ${formatINR(
    property.rent,
  )}/month | RentEase`;

  const description = `${property.beds} BHK ${property.type.toLowerCase()} in ${
    property.locality
  }, ${property.city}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function PropertyPage({
  params,
}: PropertyPageProps) {
  const { propertyId } = await params;

  const apiProperty = await getProperty(propertyId);

  if (!apiProperty) {
    notFound();
  }

  const property = adaptApiProperty(apiProperty);

  return <PropertyDetailClient property={property} />;
}