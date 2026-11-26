
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Home, MapPin, User } from "lucide-react";

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

export default function AdminPropertiesClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchProperties() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/properties", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load properties.");
      }

      setProperties(data.properties ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load submitted properties."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <section className="mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Submitted properties</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Review listings awaiting Admin verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border px-3 py-1.5 text-sm">
            {properties.length} awaiting review
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchProperties}
            disabled={loading}
          >
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center rounded-2xl border p-12">
          <Loader2 className="size-7 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button className="mt-4" onClick={fetchProperties}>
            Try again
          </Button>
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center">
          <Home className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h4 className="font-semibold">No properties awaiting review</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Newly submitted landlord listings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {properties.map((property) => {
            const assessment = property.assessments?.[0];

            return (
              <article
                key={property.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="grid gap-5 p-5 md:grid-cols-[190px_1fr]">
                  <div className="grid grid-cols-2 gap-2">
                    {property.images.slice(0, 4).map((image) => (
                      <img
                        key={image.id}
                        src={image.url}
                        alt={property.title}
                        className="h-24 w-full rounded-lg object-cover"
                      />
                    ))}

                    {property.images.length === 0 && (
                      <div className="col-span-2 flex h-48 items-center justify-center rounded-lg bg-muted">
                        <Home className="size-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold">
                          {property.title}
                        </h4>

                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {property.locality}, {property.city}
                        </p>
                      </div>

                      <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                        {property.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-muted-foreground">Monthly rent</p>
                        <p className="font-semibold">
                          ₹{Number(property.rent).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Area</p>
                        <p className="font-semibold">{property.area} sq ft</p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Configuration</p>
                        <p className="font-semibold">
                          {property.bedrooms} BHK · {property.bathrooms} Bath
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Trust Score</p>
                        <p className="font-semibold">
                          {assessment
                            ? `${assessment.trustScore}/100`
                            : "Not assessed"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-muted/50 p-3">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <User className="size-4" />
                        Landlord: {property.owner.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {property.owner.email}
                      </p>
                    </div>

                    {assessment && (
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                          <span className="font-medium">Rent estimate</span>
                          <span>
                            ₹{Number(assessment.estimatedRentLow).toLocaleString("en-IN")}
                            {" – "}
                            ₹{Number(assessment.estimatedRentHigh).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {assessment.listedRentOutsideRange && (
                          <p className="rounded-lg border border-orange-300 bg-orange-50 p-2 text-xs text-orange-800">
                            Listed rent is outside the estimated range.
                            Admin review is required.
                          </p>
                        )}

                        <div className="grid gap-2 pt-2 sm:grid-cols-2">
                          {assessment.signals.map((signal) => (
                            <div key={signal.label} className="text-xs">
                              <div className="mb-1 flex justify-between">
                                <span>{signal.label}</span>
                                <span>{signal.score}/100</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${signal.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <p className="text-xs text-muted-foreground">
                        Submitted:{" "}
                        {new Date(property.createdAt).toLocaleDateString("en-IN")}
                      </p>

                      <Button variant="outline" size="sm">
                        <Link
                          href={`/dashboard/admin/properties/${property.id}`}
                        >
                          Review details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
