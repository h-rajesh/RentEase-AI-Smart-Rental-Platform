"use client";

import Link from "next/link";

import {
  Bell,
  Plus,
  User,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useEffect, useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  DashboardShell,
  Panel,
  StatCard,
} from "@/components/rentease/DashboardShell";

import {
  RiskChip,
} from "@/components/rentease/TrustScore";

import {
  PROPERTIES,
  formatINR,
  priceVerdict,
} from "@/lib/rentease-data";

const MINE = [
  PROPERTIES[0]!,
  PROPERTIES[1]!,
  PROPERTIES[4]!,
];

const REQUESTS = [
  {
    tenant: "Aarav Sharma",
    property: "Skyline Residency",
    when: "16 Aug",
    status: "New",
  },
  {
    tenant: "Neha Verma",
    property: "Urban Nest",
    when: "14 Aug",
    status: "Visit scheduled",
  },
  {
    tenant: "Imran Qureshi",
    property: "Skyline Residency",
    when: "11 Aug",
    status: "Declined",
  },
];

const NOTIFICATIONS = [
  {
    title: "Trust assessment updated",
    body: "Greenfield Court dropped to 68 — price consistency fell.",
  },
  {
    title: "New rental request",
    body: "Aarav Sharma requested Skyline Residency.",
  },
  {
    title: "Rent estimate refreshed",
    body: "Urban Nest range moved to ₹29,000–₹33,500.",
  },
];

type LandlordProperty = {
  id: string;
  title: string;
  description: string;
  type: string;
  city: string;
  locality: string;
  rent: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  furnishing: string;
  amenities: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  images: {
    id: string;
    url: string;
    sortOrder: number;
  }[];
  latestAssessment: {
    trustScore: number;
    signals: unknown;
    estimatedRentLow: number;
    estimatedRentMid: number;
    estimatedRentHigh: number;
    listedRentOutsideRange: boolean;
    propertyUpdatedAt: string;
    createdAt: string;
  } | null;
};

export default function LandlordDashboardClient() {
  const [properties, setProperties] = useState<LandlordProperty[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProperties() {
      try {
        setLoadingProperties(true);
        setPropertiesError("");

        const response = await fetch("/api/landlord/properties", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load your properties.");
        }

        if (active) {
          setProperties(data.properties ?? []);
        }
      } catch (error) {
        if (active) {
          setPropertiesError(
            error instanceof Error
              ? error.message
              : "Something went wrong while loading properties."
          );
        }
      } finally {
        if (active) {
          setLoadingProperties(false);
        }
      }
    }

    fetchProperties();

    return () => {
      active = false;
    };
  }, []);

  const monthly = properties.reduce(
    (sum, property) => sum + property.rent,
    0
  );

  const currentAssessments = properties.filter(
    (property) =>
      property.latestAssessment &&
      new Date(property.latestAssessment.propertyUpdatedAt).getTime() ===
      new Date(property.updatedAt).getTime()
  );

  const averageTrustScore = currentAssessments.length
    ? Math.round(
      currentAssessments.reduce(
        (sum, property) =>
          sum + property.latestAssessment!.trustScore,
        0
      ) / currentAssessments.length
    )
    : "—";

  return (
    <DashboardShell
      role="Landlord"
      title="Your portfolio at a glance"
      subtitle="Listings, tenant requests and the intelligence RentEase generates for each property."
      nav={[
        {
          label: "Overview",
          href: "/dashboard/landlord",
        },
        {
          label: "Add Property",
          href: "/dashboard/landlord/add",
        },
        {
          label: "Properties",
          href: "/properties",
        },
        {
          label: "Rent Estimator",
          href: "/rent-estimator",
        },
      ]}
      actions={
        <Link
          href="/dashboard/landlord/add"
          className={buttonVariants()}
        >
          <Plus className="size-4" />
          Add Property
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My properties"
          value={loadingProperties ? "..." : properties.length}
          hint="All your property listings"
        />

        <StatCard
          label="Monthly rent listed"
          value={formatINR(monthly)}
          tone="primary"
        />

        <StatCard
          label="Open requests"
          value="—"
          hint="Rental request tracking not connected"
          tone="warm"
        />

        <StatCard
          label="Avg. Trust Score"
          value={loadingProperties ? "..." : averageTrustScore}
          hint={`${currentAssessments.length} current assessments`}
        />
      </div>

      {/* Dashboard Tabs */}
      <Tabs
        defaultValue="properties"
        className="mt-8"
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="properties">
            My Properties
          </TabsTrigger>

          <TabsTrigger value="requests">
            Rental Requests
          </TabsTrigger>

          <TabsTrigger value="trust">
            Trust Scores
          </TabsTrigger>

          <TabsTrigger value="estimates">
            AI Rent Estimates
          </TabsTrigger>

          <TabsTrigger value="notifications">
            Notifications
          </TabsTrigger>

          <TabsTrigger value="profile">
            Profile
          </TabsTrigger>
        </TabsList>

        {/* ==================== */}
        {/* MY PROPERTIES */}
        {/* ==================== */}
        <TabsContent
          value="properties"
          className="mt-6"
        >
          <Panel
            title="My Properties"
            description="Everything you have listed on RentEase."
          >
            <div className="space-y-3">
              {loadingProperties ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading your properties...
                </p>
              ) : propertiesError ? (
                <p className="py-8 text-center text-sm text-destructive">
                  {propertiesError}
                </p>
              ) : properties.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-medium">You haven't added any properties yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add your first property to start building your portfolio.
                  </p>
                  <Link
                    href="/dashboard/landlord/add"
                    className={buttonVariants({ className: "mt-4" })}
                  >
                    <Plus className="mr-2 size-4" />
                    Add Property
                  </Link>
                </div>
              ) : (
                properties.map((property) => {
                  const assessment = property.latestAssessment;

                  const hasCurrentAssessment =
                    assessment &&
                    new Date(assessment.propertyUpdatedAt).getTime() ===
                    new Date(property.updatedAt).getTime();

                  return (
                    <div
                      key={property.id}
                      className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3"
                    >
                      {property.images[0]?.url ? (
                        <img
                          src={property.images[0].url}
                          alt={property.title}
                          loading="lazy"
                          className="size-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="grid size-16 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">
                          No image
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{property.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {property.locality}, {property.city} · {property.bedrooms} BHK ·{" "}
                          {property.area} sqft
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatINR(property.rent)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {property.status.toLowerCase().replaceAll("_", " ")}
                        </p>
                      </div>

                      {hasCurrentAssessment ? (
                        <RiskChip score={assessment.trustScore} />
                      ) : (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          Not assessed
                        </span>
                      )}

                      <Link
                        href={`/dashboard/landlord/properties/${property.id}`}
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                      >
                        View
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </TabsContent>

        {/* ==================== */}
        {/* RENTAL REQUESTS */}
        {/* ==================== */}
        <TabsContent
          value="requests"
          className="mt-6"
        >
          <Panel
            title="Rental Requests"
            description="Tenant enquiries awaiting your response."
          >
            <ul className="space-y-3">
              {REQUESTS.map((request) => (
                <li
                  key={`${request.tenant}-${request.property}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {request.tenant}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {request.property} ·{" "}
                      {request.when}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {request.status}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                    >
                      Respond
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        {/* ==================== */}
        {/* TRUST SCORES */}
        {/* ==================== */}
        <TabsContent
          value="trust"
          className="mt-6"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                {loadingProperties ? "Loading trust assessments..." : "No property assessments found."}
              </p>
            ) : (
              properties.map((property) => {
                const assessment = property.latestAssessment;
                const signals = Array.isArray(assessment?.signals)
                  ? (assessment.signals as { label: string; score: number }[])
                  : [];

                return (
                  <Panel
                    key={property.id}
                    title={property.title}
                    description={
                      assessment
                        ? `Trust Score ${assessment.trustScore}/100`
                        : "Not assessed yet"
                    }
                  >
                    {signals.length > 0 ? (
                      <ul className="space-y-2.5">
                        {signals.map((signal) => (
                          <li key={signal.label}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{signal.label}</span>
                              <span className="tabular-nums text-muted-foreground">
                                {signal.score}
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 rounded-full bg-surface-strong">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${signal.score}%` }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-4 text-xs text-muted-foreground">
                        No assessment data available. Generate an assessment from the Add/Edit Property page.
                      </p>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                      AI-assisted risk indicator. Improve the weakest signals to raise the score.
                    </p>
                  </Panel>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ==================== */}
        {/* RENT ESTIMATES */}
        {/* ==================== */}
        <TabsContent
          value="estimates"
          className="mt-6"
        >
          <Panel
            title="AI Rent Estimates"
            description="Listed rent compared with the modelled range."
          >
            <div className="space-y-3">
              {properties.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {loadingProperties ? "Loading rent estimates..." : "No property estimates found."}
                </p>
              ) : (
                properties.map((property) => {
                  const assessment = property.latestAssessment;
                  const low = assessment?.estimatedRentLow;
                  const high = assessment?.estimatedRentHigh;

                  return (
                    <div
                      key={property.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {property.title}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {low && high
                            ? `Expected ${formatINR(low)} – ${formatINR(high)}`
                            : "Assessment required for estimate"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatINR(property.rent)} listed
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {assessment?.listedRentOutsideRange
                            ? "Outside expected range"
                            : assessment
                              ? "Within expected range"
                              : "Not assessed"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </TabsContent>

        {/* ==================== */}
        {/* NOTIFICATIONS */}
        {/* ==================== */}
        <TabsContent
          value="notifications"
          className="mt-6"
        >
          <Panel title="Notifications">
            <ul className="space-y-3">
              {NOTIFICATIONS.map(
                (notification) => (
                  <li
                    key={notification.title}
                    className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <Bell className="size-4" />
                    </span>

                    <div>
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {notification.body}
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </Panel>
        </TabsContent>

        {/* ==================== */}
        {/* PROFILE */}
        {/* ==================== */}
        <TabsContent
          value="profile"
          className="mt-6"
        >
          <Panel
            title="Profile"
            description="Details shown to tenants on your listings."
          >
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-5">
              <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <User className="size-5" />
              </span>

              <div className="flex-1">
                <p className="font-display text-base font-semibold">
                  Ravi Prakash
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Landlord since 2021 · Contact
                  verified · Usually replies
                  within 3 hours
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
              >
                Edit profile
              </Button>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}