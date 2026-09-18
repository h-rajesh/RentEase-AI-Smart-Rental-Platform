"use client";

import { useState ,useRef} from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ImagePlus,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadPropertyImage } from "@/lib/supabase/storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DashboardShell,
  Panel,
} from "@/components/rentease/DashboardShell";

import { Disclaimer } from "@/components/rentease/Section";

import { cn } from "@/lib/utils";

import {
  AMENITIES,
  CITIES,
  FURNISHING,
  PROPERTY_TYPES,
  estimateRent,
  priceVerdict,
} from "@/lib/rentease-data";

import {
  AssessmentPanel,
} from "@/components/rentease/landlord/AssessmentPanel";

import {
  FormField,
} from "@/components/rentease/landlord/FormField";

type Assessment = {
  score: number;
  signals: {
    label: string;
    score: number;
  }[];
  issues: string[];
  estimate: {
    low: number;
    high: number;
    mid: number;
  };
  listed: number;
};

type PropertyForm = {
  title: string;
  type: string;
  city: string;
  locality: string;
  rent: string;
  area: string;
  beds: string;
  baths: string;
  furnishing: string;
  description: string;
};

export default function AddPropertyClient() {
  const [form, setForm] =
    useState<PropertyForm>({
      title: "",
      type: "Apartment",
      city: "Hyderabad",
      locality: "",
      rent: "",
      area: "",
      beds: "2",
      baths: "2",
      furnishing: "Semi-furnished",
      description: "",
    });

  const [amenities, setAmenities] =
    useState<string[]>([]);

  const [images, setImages] = useState<
  {
    file: File;
    preview: string;
  }[]
>([]);

const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] =
    useState<Record<string, string | undefined>>({});

  const [loading, setLoading] =
    useState(false);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const set = (
    key: keyof PropertyForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
  };

const submit = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  const next: Record<string, string> = {};

  if (form.title.trim().length < 5) {
    next.title =
      "Give the listing a descriptive title.";
  }

  if (form.locality.trim().length < 3) {
    next.locality =
      "Add the locality or neighbourhood.";
  }

  if (
    !form.rent ||
    Number(form.rent) < 1000
  ) {
    next.rent =
      "Enter a monthly rent in rupees.";
  }

  if (
    !form.area ||
    Number(form.area) < 150
  ) {
    next.area =
      "Enter the carpet area in sq ft.";
  }

  if (
    form.description.trim().length < 40
  ) {
    next.description =
      "Write at least 40 characters so tenants know what to expect.";
  }

  setErrors(next);

  if (Object.keys(next).length > 0) {
    return;
  }

  setLoading(true);
  setAssessment(null);

  try {
    const response = await fetch("/api/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        city: form.city,
        locality: form.locality.trim(),

        rent: Number(form.rent),
        area: Number(form.area),
        bedrooms: Number(form.beds),
        bathrooms: Number(form.baths),
        furnishing: form.furnishing,

        // Coordinates will be added when
        // location handling is implemented.
        latitude: null,
        longitude: null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to create property."
      );
    }

    const propertyId = data.property.id;

for (const [index, image] of images.entries()) {
  const uploaded = await uploadPropertyImage(
    image.file,
    propertyId,
  );

  const imageResponse = await fetch(
    `/api/properties/${propertyId}/images`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: uploaded.url,
        storageKey: uploaded.storageKey,
        sortOrder: index,
      }),
    },
  );

  const imageData = await imageResponse.json();

  if (!imageResponse.ok) {
    throw new Error(
      imageData.error ||
        `Unable to save image ${index + 1}.`,
    );
  }
}

    /*
     * Property has now been saved in PostgreSQL.
     *
     * Keep the existing demo assessment temporarily.
     * The real Trust Score and AI Rent Estimator
     * will be connected in their respective modules.
     */

    const estimate = estimateRent({
      city: form.city,
      type: form.type,
      beds: Number(form.beds),
      baths: Number(form.baths),
      area: Number(form.area),
      furnishing: form.furnishing,
      amenities,
    });

    const listed = Number(form.rent);

    const verdict = priceVerdict(
      listed,
      estimate,
    );

    const completeness = Math.min(
      100,
      55 +
        images.length * 9 +
        amenities.length * 3 +
        (form.description.length > 120
          ? 12
          : 4),
    );

    const priceConsistency =
      verdict.tone === "low"
        ? 92
        : verdict.tone === "moderate"
          ? 74
          : 52;

    const imageSimilarity =
      images.length >= 3
        ? 90
        : images.length > 0
          ? 76
          : 60;

    const locationConsistency =
      form.locality.length > 4
        ? 90
        : 72;

    const infoQuality = Math.min(
      96,
      50 +
        Math.round(
          form.description.length / 6,
        ),
    );

    const signals = [
      {
        label: "Listing completeness",
        score: completeness,
      },
      {
        label: "Price consistency",
        score: priceConsistency,
      },
      {
        label: "Image similarity",
        score: imageSimilarity,
      },
      {
        label: "Location consistency",
        score: locationConsistency,
      },
      {
        label:
          "Listing information quality",
        score: infoQuality,
      },
    ];

    const score = Math.round(
      signals.reduce(
        (sum, signal) =>
          sum + signal.score,
        0,
      ) / signals.length,
    );

    const issues: string[] = [];

    if (images.length < 3) {
      issues.push(
        "Add at least three photos, including one exterior shot.",
      );
    }

    if (verdict.tone !== "low") {
      issues.push(
        `Listed rent is ${verdict.label.toLowerCase()} for this configuration.`,
      );
    }

    if (amenities.length < 3) {
      issues.push(
        "List the building amenities tenants filter by.",
      );
    }

    if (form.description.length < 140) {
      issues.push(
        "Expand the description with floor, facing and nearby landmarks.",
      );
    }

    setAssessment({
      score,
      signals,
      issues,
      estimate,
      listed,
    });

    toast.success(
      "Property created successfully",
      {
        description: `Property saved as a draft — assessment score ${score}/100.`,
      },
    );
  } catch (error) {
    console.error(
      "Create property error:",
      error,
    );

    toast.error(
      error instanceof Error
        ? error.message
        : "Unable to create property.",
    );
  } finally {
    setLoading(false);
  }
};

  const toggleAmenity = (
    amenity: string,
  ) => {
    setAmenities((current) =>
      current.includes(amenity)
        ? current.filter(
            (item) => item !== amenity,
          )
        : [...current, amenity],
    );
  };

const handleImageSelect = (
  event: React.ChangeEvent<HTMLInputElement>,
) => {
  const files = Array.from(
    event.target.files ?? [],
  );

  if (files.length === 0) {
    return;
  }

  const validFiles = files.filter((file) => {
    if (!file.type.startsWith("image/")) {
      toast.error(
        `${file.name} is not a valid image.`,
      );

      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        `${file.name} is larger than 5 MB.`,
      );

      return false;
    }

    return true;
  });

  const remainingSlots = 10 - images.length;

  const filesToAdd = validFiles.slice(
    0,
    remainingSlots,
  );

  if (validFiles.length > remainingSlots) {
    toast.error(
      "You can upload a maximum of 10 images.",
    );
  }

  const newImages = filesToAdd.map((file) => ({
    file,
    preview: URL.createObjectURL(file),
  }));

  setImages((current) => [
    ...current,
    ...newImages,
  ]);

  // Allows selecting the same file again later.
  event.target.value = "";
};
const removeImage = (index: number) => {
  setImages((current) => {
    const image = current[index];

    if (image) {
      URL.revokeObjectURL(image.preview);
    }

    return current.filter(
      (_, imageIndex) =>
        imageIndex !== index,
    );
  });
};

  return (
    <DashboardShell
      role="Landlord"
      title="Add a property"
      subtitle="Publish a listing and RentEase generates a trust assessment and rent estimate before it goes live."
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
        <Button
          
          variant="outline"
        >
          <Link href="/dashboard/landlord">
            Back to overview
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        {/* Form */}
        <form
          onSubmit={submit}
          className="surface-panel space-y-5 p-6 sm:p-7"
        >
          <FormField
            label="Property title"
            error={errors.title}
          >
            <Input
              value={form.title}
              onChange={(event) =>
                set(
                  "title",
                  event.target.value,
                )
              }
              placeholder="Spacious 2 BHK with balcony"
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Property type">
              <Select
                value={form.type}
                onValueChange={(value) =>
                  value && set("type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {PROPERTY_TYPES.map(
                    (type) => (
                      <SelectItem
                        key={type}
                        value={type}
                      >
                        {type}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="City">
              <Select
                value={form.city}
                onValueChange={(value) =>
                  value && set("city", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem
                      key={city}
                      value={city}
                    >
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Locality"
              error={errors.locality}
            >
              <Input
                value={form.locality}
                onChange={(event) =>
                  set(
                    "locality",
                    event.target.value,
                  )
                }
                placeholder="Gachibowli"
              />
            </FormField>

            <FormField
              label="Monthly rent (₹)"
              error={errors.rent}
            >
              <Input
                inputMode="numeric"
                value={form.rent}
                onChange={(event) =>
                  set(
                    "rent",
                    event.target.value.replace(
                      /[^0-9]/g,
                      "",
                    ),
                  )
                }
                placeholder="24000"
              />
            </FormField>

            <FormField
              label="Area (sq ft)"
              error={errors.area}
            >
              <Input
                inputMode="numeric"
                value={form.area}
                onChange={(event) =>
                  set(
                    "area",
                    event.target.value.replace(
                      /[^0-9]/g,
                      "",
                    ),
                  )
                }
                placeholder="1250"
              />
            </FormField>

            <FormField label="Furnishing">
              <Select
                value={form.furnishing}
                onValueChange={(value) =>
                  value &&
                  set(
                    "furnishing",
                    value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {FURNISHING.map(
                    (furnishing) => (
                      <SelectItem
                        key={furnishing}
                        value={furnishing}
                      >
                        {furnishing}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Bedrooms">
              <Select
                value={form.beds}
                onValueChange={(value) =>
                  value && set("beds", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                  ].map((number) => (
                    <SelectItem
                      key={number}
                      value={number}
                    >
                      {number} BHK
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Bathrooms">
              <Select
                value={form.baths}
                onValueChange={(value) =>
                  value && set("baths", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[
                    "1",
                    "2",
                    "3",
                    "4",
                  ].map((number) => (
                    <SelectItem
                      key={number}
                      value={number}
                    >
                      {number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Amenities */}
          <FormField label="Amenities">
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => {
                const active =
                  amenities.includes(
                    amenity,
                  );

                return (
                  <label
                    key={amenity}
                    className={
                      cn(
                        "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary/40 bg-accent text-accent-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30",
                      )
                    }
                  >
                    <Checkbox
                      checked={active}
                      onCheckedChange={() =>
                        toggleAmenity(
                          amenity,
                        )
                      }
                      className="size-3.5"
                    />

                    {amenity}
                  </label>
                );
              })}
            </div>
          </FormField>

          {/* Description */}
          <FormField
            label="Description"
            error={errors.description}
          >
            <Textarea
              rows={5}
              value={form.description}
              onChange={(event) =>
                set(
                  "description",
                  event.target.value,
                )
              }
              placeholder="Describe the layout, floor, facing, nearby landmarks and what is included in the rent."
            />
          </FormField>

          {/* Images */}
          <FormField label="Property images">
           <div className="flex flex-wrap gap-3">
  {images.map((image, index) => (
    <div
      key={`${image.preview}-${index}`}
      className="relative size-24 overflow-hidden rounded-lg border border-border bg-surface"
    >
      <img
        src={image.preview}
        alt={`Property image ${index + 1}`}
        className="h-full w-full object-cover"
      />

      <button
        type="button"
        onClick={() => removeImage(index)}
        className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-white"
        aria-label={`Remove image ${index + 1}`}
      >
        ×
      </button>
    </div>
  ))}

  {images.length < 10 && (
    <button
      type="button"
      onClick={() =>
        fileInputRef.current?.click()
      }
      className="grid size-24 place-items-center rounded-lg border border-dashed border-border bg-surface text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      aria-label="Add property image"
    >
      <ImagePlus className="size-5" />
    </button>
  )}

  <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    onChange={handleImageSelect}
    className="hidden"
  />
</div>

<p className="mt-2 text-xs text-muted-foreground">
  Upload up to 10 images. Maximum 5 MB per image.
</p>
          </FormField>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}

            {loading
              ? "Generating trust assessment…"
              : "Submit & Generate Listing Trust Assessment"}
          </Button>
        </form>

        {/* Assessment */}
        <div className="lg:sticky lg:top-24">
          {loading ? (
            <Panel
              title="Listing Trust Assessment"
              description="Reviewing your listing…"
            >
              <div className="space-y-4">
                <div className="mx-auto size-36 animate-pulse rounded-full bg-surface-strong" />

                <div className="h-3 w-full animate-pulse rounded bg-surface-strong" />

                <div className="h-3 w-4/5 animate-pulse rounded bg-surface-strong" />

                <div className="h-20 w-full animate-pulse rounded-xl bg-surface-strong" />
              </div>
            </Panel>
          ) : assessment ? (
            <AssessmentPanel
              assessment={assessment}
            />
          ) : (
            <Panel
              title="Listing Trust Assessment"
              description="Submit the form to generate a trust assessment, risk indicators and a rent estimate."
            >
              <Disclaimer>
                RentEase assesses listing risk
                from completeness, price
                consistency, image similarity,
                location consistency and
                information quality. It does
                not verify ownership or legal
                title.
              </Disclaimer>
            </Panel>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}