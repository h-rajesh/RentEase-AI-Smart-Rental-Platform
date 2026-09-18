"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Section,
  SectionHeading,
} from "@/components/rentease/Section";
import { PropertyCard } from "@/components/rentease/PropertyCard";
import { Button } from "@/components/ui/button";
import {
  CITIES,
  type Property,
} from "@/lib/rentease-data";
import { cn } from "@/lib/utils";

const SORTS = [
  "Recommended",
  "Rent: low to high",
  "Rent: high to low",
] as const;

type SortOption = (typeof SORTS)[number];

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
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

function adaptApiPropertyToCardProperty(apiProp: ApiProperty): Property {
  const imageUrls =
    apiProp.images.length > 0
      ? apiProp.images.map((img) => img.url)
      : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"];

  return {
    id: apiProp.id,
    name: apiProp.title,
    type: apiProp.type,
    city: apiProp.city,
    locality: apiProp.locality,
    rent: apiProp.rent,
    beds: apiProp.bedrooms,
    baths: apiProp.bathrooms,
    area: apiProp.area,
    furnishing:
      (apiProp.furnishing as "Unfurnished" | "Semi-furnished" | "Fully furnished") ||
      "Semi-furnished",
    trustScore: 88,
    images: imageUrls,
    amenities: ["Power Backup", "Security", "Parking"],
    description: apiProp.description,
    landlord: {
      name: apiProp.owner.name || "Landlord",
      since: apiProp.owner.createdAt
        ? new Date(apiProp.owner.createdAt).getFullYear().toString()
        : "2024",
      verifiedContact: true,
      responseTime: "< 1 hour",
    },
    estimate: {
      low: Math.round(apiProp.rent * 0.92),
      high: Math.round(apiProp.rent * 1.08),
    },
    signals: [
      {
        label: "Price consistency",
        score: 90,
        note: "Aligned with market rates",
      },
    ],
    status: "Active",
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] =
    useState<ApiProperty[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [city, setCity] =
    useState<string>("All");

  const [sort, setSort] =
    useState<SortOption>("Recommended");

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/properties"
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load properties."
          );
        }

        const data = await response.json();

        setProperties(data.properties ?? []);
      } catch (err) {
        console.error(
          "Error loading properties:",
          err
        );

        setError(
          "Unable to load properties. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const results = useMemo(() => {
    const list = properties.filter(
      (property) =>
        city === "All" ||
        property.city === city,
    );

    switch (sort) {
      case "Rent: low to high":
        return [...list].sort(
          (a, b) => a.rent - b.rent,
        );

      case "Rent: high to low":
        return [...list].sort(
          (a, b) => b.rent - a.rent,
        );

      default:
        return list;
    }
  }, [properties, city, sort]);

  return (
    <Section>
      <SectionHeading
        eyebrow="Property discovery"
        title="Properties worth looking at."
        description="Every listing carries an AI-assisted Trust Score and an expected rent range, so you can compare quality as well as price."
      />

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {["All", ...CITIES].map(
          (cityName) => (
            <button
              key={cityName}
              type="button"
              onClick={() =>
                setCity(cityName)
              }
              suppressHydrationWarning
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                city === cityName
                  ? "border-primary/40 bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30",
              )}
            >
              {cityName}
            </button>
          ),
        )}

        {/* Sorting */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {SORTS.map((sortOption) => (
            <button
              key={sortOption}
              type="button"
              onClick={() =>
                setSort(sortOption)
              }
              suppressHydrationWarning
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                sort === sortOption
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {sortOption}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="mt-8 text-sm text-muted-foreground">
          Loading properties...
        </p>
      )}

      {error && !loading && (
        <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Result count */}
          <p className="mt-5 text-sm text-muted-foreground">
            {results.length}{" "}
            {results.length === 1
              ? "property"
              : "properties"}{" "}
            available
            {city !== "All"
              ? ` in ${city}`
              : ""}
          </p>

          {/* Results */}
          {results.length === 0 ? (
            <EmptyState
              onReset={() => setCity("All")}
            />
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(
                (property, index) => (
                  <PropertyCard
                    key={property.id}
                    property={adaptApiPropertyToCardProperty(property)}
                    index={index}
                  />
                ),
              )}
            </div>
          )}
        </>
      )}
    </Section>
  );
}

function EmptyState({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <h3 className="font-display text-lg font-semibold">
        No listings in this city yet
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        RentEase is expanding city by
        city. Try another location or
        widen your search.
      </p>

      <Button
        className="mt-6"
        onClick={onReset}
      >
        Show all cities
      </Button>
    </div>
  );
}