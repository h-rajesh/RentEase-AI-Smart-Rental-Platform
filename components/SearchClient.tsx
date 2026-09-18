"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  Section,
  SectionHeading,
} from "@/components/rentease/Section";

import { SearchFilters } from "@/components/rentease/search/SearchFilters";
import { SearchResults } from "@/components/rentease/search/SearchResults";

import {
  PROPERTIES,
} from "@/lib/rentease-data";

export interface SearchFiltersState {
  city: string;
  minRent: string;
  maxRent: string;
  type: string;
  beds: string;
  furnishing: string;
  minTrust: number;
  minArea: number;
  amenities: string[];
  lowerRisk: boolean;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const urlCity = searchParams.get("city") ?? "Any";

  const [filters, setFilters] =
    useState<SearchFiltersState>({
      city: urlCity,
      minRent: "",
      maxRent: "",
      type: "Any",
      beds: "Any",
      furnishing: "Any",
      minTrust: 0,
      minArea: 500,
      amenities: [],
      lowerRisk: false,
    });

  const [prevUrlCity, setPrevUrlCity] = useState(urlCity);
  if (prevUrlCity !== urlCity) {
    setPrevUrlCity(urlCity);
    setFilters((current) => ({
      ...current,
      city: urlCity,
    }));
  }

  const [showAdvanced, setShowAdvanced] =
    useState(false);

  const [searching, setSearching] =
    useState(false);

  const updateFilter = <
    K extends keyof SearchFiltersState,
  >(
    key: K,
    value: SearchFiltersState[K],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleAmenity = (
    amenity: string,
  ) => {
    setFilters((current) => ({
      ...current,

      amenities:
        current.amenities.includes(amenity)
          ? current.amenities.filter(
              (item) => item !== amenity,
            )
          : [
              ...current.amenities,
              amenity,
            ],
    }));
  };

  const reset = () => {
    setFilters({
      city: "Any",
      minRent: "",
      maxRent: "",
      type: "Any",
      beds: "Any",
      furnishing: "Any",
      minTrust: 0,
      minArea: 500,
      amenities: [],
      lowerRisk: false,
    });

    setShowAdvanced(false);
  };

  const results = useMemo(() => {
    return PROPERTIES.filter((property) => {
      if (
        filters.city !== "Any" &&
        property.city !== filters.city
      ) {
        return false;
      }

      if (
        filters.minRent &&
        property.rent <
          Number(filters.minRent)
      ) {
        return false;
      }

      if (
        filters.maxRent &&
        property.rent >
          Number(filters.maxRent)
      ) {
        return false;
      }

      if (
        filters.type !== "Any" &&
        property.type !== filters.type
      ) {
        return false;
      }

      if (
        filters.beds !== "Any" &&
        property.beds !== Number(filters.beds)
      ) {
        return false;
      }

      if (
        filters.furnishing !== "Any" &&
        property.furnishing !==
          filters.furnishing
      ) {
        return false;
      }

      if (
        property.trustScore <
        filters.minTrust
      ) {
        return false;
      }

      if (
        property.area < filters.minArea
      ) {
        return false;
      }

      if (
        filters.lowerRisk &&
        property.trustScore < 85
      ) {
        return false;
      }

      if (
        filters.amenities.length > 0 &&
        !filters.amenities.every(
          (amenity) =>
            property.amenities.includes(
              amenity,
            ),
        )
      ) {
        return false;
      }

      return true;
    });
  }, [filters]);

  const runSearch = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSearching(true);

    window.setTimeout(() => {
      setSearching(false);
    }, 650);
  };

  return (
    <Section>
      <SectionHeading
        eyebrow="Search experience"
        title="Search rentals the way you actually decide."
        description="Combine the usual filters with listing-risk filters, so quality and price are weighed together."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <SearchFilters
          filters={filters}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() =>
            setShowAdvanced(
              (current) => !current,
            )
          }
          onUpdateFilter={updateFilter}
          onToggleAmenity={toggleAmenity}
          onReset={reset}
          onSubmit={runSearch}
        />

        <SearchResults
          results={results}
          searching={searching}
          onReset={reset}
        />
      </div>
    </Section>
  );
}
