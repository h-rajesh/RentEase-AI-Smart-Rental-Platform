
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, MapPin, User, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type Assessment = {
  trustScore: number;
  estimatedRentLow: string;
  estimatedRentMid: string;
  estimatedRentHigh: string;
  listedRentOutsideRange: boolean;
  signals: {
    label: string;
    score: number;
  }[];
};

type Property = {
  id: string;
  title: string;
  description: string;
  type: string;
  city: string;
  locality: string;
  rent: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  amenities: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    name: string;
    email: string;
  };
  images: {
    id: string;
    url: string;
  }[];
  assessments: Assessment[];
};

export default function AdminPropertyReviewClient({
  propertyId,
}: {
  propertyId: string;
}) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProperty() {
      try {
        const response = await fetch("/api/admin/properties", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load property.");
        }

        const found = (data.properties ?? []).find(
          (item: Property) => item.id === propertyId
        );

        if (!found) {
          throw new Error(
            "This property is not in the submitted review queue. It may already have been reviewed."
          );
        }

        if (active) setProperty(found);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load property."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProperty();

    return () => {
      active = false;
    };
  }, [propertyId]);

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin" />
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-sm text-destructive">
          {error || "Property not found."}
        </p>
        <Button className="mt-5" variant="outline">
          <Link href="/dashboard/admin/properties">
            Back to properties
          </Link>
        </Button>
      </main>
    );
  }

  const assessment = property.assessments?.[0];
  const rent = Number(property.rent);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <Link
        href="/dashboard/admin/properties"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to submitted properties
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow">Admin verification</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">
            {property.title}
          </h1>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {property.locality}, {property.city}
          </p>
        </div>

        <span className="rounded-full border px-3 py-1.5 text-xs font-semibold">
          {property.status}
        </span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {property.images.map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt={property.title}
                className="h-44 w-full rounded-xl border object-cover"
              />
            ))}
          </div>

          <section className="rounded-2xl border p-5">
            <h2 className="font-semibold">Property information</h2>

            <div className="mt-4 grid grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-muted-foreground">Property type</p>
                <p className="mt-1 font-medium">{property.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly rent</p>
                <p className="mt-1 font-medium">
                  ₹{rent.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Area</p>
                <p className="mt-1 font-medium">{property.area} sq ft</p>
              </div>
              <div>
                <p className="text-muted-foreground">Configuration</p>
                <p className="mt-1 font-medium">
                  {property.bedrooms} BHK · {property.bathrooms} Bath
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Furnishing</p>
                <p className="mt-1 font-medium">{property.furnishing}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Submitted on</p>
                <p className="mt-1 font-medium">
                  {new Date(property.updatedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t pt-4">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {property.description}
              </p>
            </div>

            <div className="mt-5 border-t pt-4">
              <h3 className="text-sm font-medium">Amenities</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full border px-3 py-1 text-xs"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <User className="size-4" />
              Landlord information
            </h2>
            <p className="mt-4 text-sm font-medium">{property.owner.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {property.owner.email}
            </p>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-5" />
              Trust assessment
            </h2>

            {assessment ? (
              <>
                <div className="mt-5 text-center">
                  <p className="text-4xl font-semibold">
                    {assessment.trustScore}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Automated Trust Score
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {assessment.signals.map((signal) => (
                    <div key={signal.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{signal.label}</span>
                        <span>{signal.score}/100</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${signal.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-muted/50 p-4">
                  <p className="text-sm font-medium">Estimated monthly rent</p>
                  <p className="mt-2 text-lg font-semibold">
                    ₹{Number(assessment.estimatedRentLow).toLocaleString("en-IN")}
                    {" – "}
                    ₹{Number(assessment.estimatedRentHigh).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mid estimate: ₹
                    {Number(assessment.estimatedRentMid).toLocaleString("en-IN")}
                  </p>
                </div>

                {assessment.listedRentOutsideRange && (
                  <p className="mt-4 rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
                    Warning: Listed rent is outside the estimated range.
                    Review this discrepancy before making a decision.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No assessment is available for this property.
              </p>
            )}
          </section>

          <section className="rounded-2xl border p-5">
            <h2 className="font-semibold">Admin verification</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Review the property details, landlord information, images and
              assessment before deciding whether to publish the listing.
            </p>
            <p className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Approval and rejection actions will be connected after the
              verification workflow and server-side checks are implemented.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
