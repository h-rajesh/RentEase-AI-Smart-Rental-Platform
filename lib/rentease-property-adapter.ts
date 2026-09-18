import type { Property } from "@/lib/rentease-data";

type ApiProperty = {
  id: string;
  title: string;
  description: string;
  type: string;
  city: string;
  locality: string;
  latitude: number | null;
  longitude: number | null;
  rent: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  status: string;

  images: {
    id: string;
    url: string;
    storageKey: string | null;
    sortOrder: number;
  }[];

  owner: {
    id: string;
    name: string;
    createdAt: string | Date;
  };

  createdAt: string | Date;
  updatedAt: string | Date;
};

export function adaptApiProperty(
  property: ApiProperty,
): Property {
  return {
    id: property.id,

    name: property.title,

    type: property.type as Property["type"],

    city: property.city,

    locality: property.locality,

    rent: property.rent,

    beds: property.bedrooms,

    baths: property.bathrooms,

    area: property.area,

    furnishing:
      property.furnishing as Property["furnishing"],

    // Temporary until Trust Score module is implemented
    trustScore: 0,

    images:
      property.images.length > 0
        ? [...property.images]
            .sort(
              (a, b) =>
                a.sortOrder - b.sortOrder,
            )
            .map((image) => image.url)
        : [],

    // Temporary until amenities are stored in DB
    amenities: [],

    description: property.description,

    landlord: {
      name: property.owner.name,

      since: new Date(
        property.owner.createdAt,
      )
        .getFullYear()
        .toString(),

      // Will be connected to verification later
      verifiedContact: false,

      responseTime: "—",
    },

    // Temporary until AI Rent Estimator is implemented
    estimate: {
      low: property.rent,
      high: property.rent,
    },

    // Temporary until Trust Score module is implemented
    signals: [],

    // Map status string from API to Property["status"] type
    status:
      property.status?.toLowerCase() === "pending_review" ||
      property.status?.toLowerCase() === "submitted"
        ? "Pending review"
        : property.status?.toLowerCase() === "needs_verification"
          ? "Needs verification"
          : "Active",
  };
}