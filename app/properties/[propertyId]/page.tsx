import type { Metadata } from "next";
import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import { formatINR } from "@/lib/rentease-data";
import { adaptApiProperty } from "@/lib/rentease-property-adapter";

import PropertyDetailClient from "@/app/properties/[propertyId]/PropertyDetailClient";

interface PropertyPageProps {
  params: Promise<{
    propertyId: string;
  }>;
}

async function getProperty(propertyId: string) {
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

  if (!property) {
    return null;
  }

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    type: property.type,
    city: property.city,
    locality: property.locality,
    latitude: property.latitude,
    longitude: property.longitude,
    rent: property.rent.toNumber(),
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
  };
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