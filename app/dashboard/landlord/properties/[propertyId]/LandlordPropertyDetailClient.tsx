
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bath,
    BedDouble,
    CalendarDays,
    Edit,
    MapPin,
    Ruler,
    Sofa,
    ShieldCheck,
    Loader2,
    ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/rentease/Section";
import { TrustScoreRing } from "@/components/rentease/TrustScore";
import { PropertyGallery } from "@/components/rentease/property/PropertyGallery";
import { formatINR } from "@/lib/rentease-data";

type PropertyDetails = {
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
        signals: {
            label: string;
            score: number;
        }[];
        estimatedRentLow: number;
        estimatedRentMid: number;
        estimatedRentHigh: number;
        listedRentOutsideRange: boolean;
        propertyUpdatedAt: string;
        createdAt: string;
    } | null;
};

export default function LandlordPropertyDetailClient({
    propertyId,
}: {
    propertyId: string;
}) {
    const router = useRouter();

    const [property, setProperty] = useState<PropertyDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function fetchProperty() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/properties/${propertyId}`,
                    { cache: "no-store" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error || "Unable to load property details."
                    );
                }

                if (active) {
                    setProperty(data.property);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Something went wrong."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        fetchProperty();

        return () => {
            active = false;
        };
    }, [propertyId]);

    if (loading) {
        return (
            <Section className="py-16">
                <div className="flex justify-center gap-3 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    Loading property details...
                </div>
            </Section>
        );
    }

    if (error || !property) {
        return (
            <Section className="py-16">
                <div className="mx-auto max-w-lg rounded-2xl border border-border p-8 text-center">
                    <h2 className="font-display text-xl font-semibold">
                        Unable to load property
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error || "Property not found."}
                    </p>
                    <Button
                        className="mt-6"
                        onClick={() => router.push("/dashboard/landlord")}
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </Section>
        );
    }

    const assessment = property.latestAssessment;

    const hasCurrentAssessment =
        assessment !== null &&
        new Date(assessment.propertyUpdatedAt).getTime() ===
        new Date(property.updatedAt).getTime();

    const statusColors: Record<string, string> = {
        DRAFT: "bg-muted text-muted-foreground",
        SUBMITTED: "bg-amber-100 text-amber-800",
        PENDING_REVIEW: "bg-amber-100 text-amber-800",
        PUBLISHED: "bg-emerald-100 text-emerald-800",
        REJECTED: "bg-red-100 text-red-800",
        RENTED: "bg-blue-100 text-blue-800",
        UNAVAILABLE: "bg-muted text-muted-foreground",
        ANALYZING: "bg-blue-100 text-blue-800",
    };

    return (
        <Section className="py-8">
            <Link
                href="/dashboard/landlord"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
                <ArrowLeft className="size-4" />
                Back to Dashboard
            </Link>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-2xl font-bold">
                            {property.title}
                        </h1>

                        <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[property.status] ??
                                "bg-muted text-muted-foreground"
                                }`}
                        >
                            {property.status.replaceAll("_", " ")}
                        </span>
                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-4" />
                        {property.locality}, {property.city}
                    </p>
                </div>

                {property.status === "DRAFT" && (
                    <Button>
                        <Link
                            href={`/dashboard/landlord/properties/${property.id}/edit`}
                            className="inline-flex items-center"
                        >
                            <Edit className="mr-2 size-4" />
                            Edit Property
                        </Link>
                    </Button>
                )}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                <div className="min-w-0">
                    {property.images.length > 0 ? (
                        <PropertyGallery
                            images={property.images.map((image) => image.url)}
                            name={property.title}
                        />
                    ) : (
                        <div className="grid aspect-video place-items-center rounded-2xl bg-muted">
                            <div className="text-center text-muted-foreground">
                                <ImageIcon className="mx-auto size-10" />
                                <p className="mt-2 text-sm">No property images uploaded</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        <h2 className="font-display text-lg font-semibold">
                            Property Overview
                        </h2>

                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                            {property.description}
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Spec
                            icon={<BedDouble className="size-4" />}
                            label="Bedrooms"
                            value={property.bedrooms}
                        />
                        <Spec
                            icon={<Bath className="size-4" />}
                            label="Bathrooms"
                            value={property.bathrooms}
                        />
                        <Spec
                            icon={<Ruler className="size-4" />}
                            label="Area"
                            value={`${property.area} sqft`}
                        />
                        <Spec
                            icon={<Sofa className="size-4" />}
                            label="Furnishing"
                            value={property.furnishing}
                        />
                    </div>

                    <div className="mt-8">
                        <h2 className="font-display text-lg font-semibold">
                            Amenities
                        </h2>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {property.amenities.length > 0 ? (
                                property.amenities.map((amenity) => (
                                    <span
                                        key={amenity}
                                        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                                    >
                                        {amenity}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No amenities added.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 rounded-2xl border border-border p-5">
                        <h2 className="font-display text-lg font-semibold">
                            Property Information
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <InfoRow
                                label="Property type"
                                value={property.type}
                            />
                            <InfoRow
                                label="Created"
                                value={new Date(property.createdAt).toLocaleDateString("en-IN")}
                            />
                            <InfoRow
                                label="Last updated"
                                value={new Date(property.updatedAt).toLocaleDateString("en-IN")}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <p className="text-sm text-muted-foreground">
                            Monthly Listed Rent
                        </p>

                        <h2 className="mt-2 font-display text-3xl font-bold">
                            {formatINR(property.rent)}
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                            {property.bedrooms} BHK {property.type}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border p-6">
                        <h2 className="font-display text-lg font-semibold">
                            Trust Score Assessment
                        </h2>

                        {hasCurrentAssessment ? (
                            <>
                                <div className="mt-5 flex justify-center">
                                    <TrustScoreRing score={assessment.trustScore} />
                                </div>

                                <p className="mt-4 text-center text-sm text-muted-foreground">
                                    Current property assessment
                                </p>

                                <div className="mt-6 space-y-4">
                                    {assessment.signals.map((signal) => (
                                        <div key={signal.label}>
                                            <div className="flex justify-between text-xs">
                                                <span>{signal.label}</span>
                                                <span className="font-semibold">
                                                    {signal.score}/100
                                                </span>
                                            </div>

                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{
                                                        width: `${Math.max(
                                                            0,
                                                            Math.min(100, signal.score)
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="mt-4 text-sm text-muted-foreground">
                                {assessment
                                    ? "This assessment is outdated. Recalculate the Trust Score after updating the property."
                                    : "No Trust Score assessment is available yet."}
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-border p-6">
                        <h2 className="font-display text-lg font-semibold">
                            Rent Estimate
                        </h2>

                        {hasCurrentAssessment ? (
                            <>
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Estimated monthly range
                                </p>

                                <p className="mt-2 font-display text-xl font-bold">
                                    {formatINR(assessment.estimatedRentLow)}
                                    {" – "}
                                    {formatINR(assessment.estimatedRentHigh)}
                                </p>

                                <p className="mt-2 text-xs text-muted-foreground">
                                    Mid estimate: {formatINR(assessment.estimatedRentMid)}
                                </p>

                                {assessment.listedRentOutsideRange && (
                                    <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                                        Your listed rent is outside the estimated range.
                                        Admin review may be required.
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                                A current assessment is required to display rent estimates.
                            </p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-border p-5">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-5 text-primary" />
                            <h2 className="font-semibold">Listing visibility</h2>
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                            {property.status === "PUBLISHED"
                                ? "Your listing is published and visible to tenants."
                                : "This listing is not publicly visible to tenants until it is approved and published."}
                        </p>
                    </div>
                </div>
            </div>
        </Section>
    );
}

function Spec({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <span className="text-muted-foreground">{icon}</span>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    );
}
