import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Section,
  SectionHeading,
} from "@/components/rentease/Section";
import { PropertyCard } from "@/components/rentease/PropertyCard";
import { PROPERTIES } from "@/lib/rentease-data";

export function DiscoverySection() {
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Property discovery"
          title="Properties worth looking at."
        />

        <Button variant="outline">
          <Link href="/properties">
            Browse all <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PROPERTIES.slice(0, 4).map((property, index) => (
          <PropertyCard
            key={property.id}
            property={property}
            index={index}
          />
        ))}
      </div>
    </Section>
  );
}
