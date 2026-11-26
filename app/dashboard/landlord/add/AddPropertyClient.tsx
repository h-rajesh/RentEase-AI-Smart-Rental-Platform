"use client";

import { useState, useRef } from "react";
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

type PropertyImageItem = {
  preview: string;
  file?: File;
  id?: string;
  url?: string;
  storageKey?: string | null;
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

  const [images, setImages] = useState<PropertyImageItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] =
    useState<Record<string, string | undefined>>({});

  const [loading, setLoading] =
    useState(false);

  // Stores the ID of the draft created in the database.
  const [propertyId, setPropertyId] =
    useState<string | null>(null);

  const [assessment, setAssessment] =
    useState<Assessment | null>(null);

  const [submitted, setSubmitted] = useState(false);

  const set = (
    key: keyof PropertyForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    // Property details changed: previous assessment is no longer valid.
    setAssessment(null);

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
      const propertyPayload = {
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
        amenities,
        latitude: null,
        longitude: null,
      };

      const response = await fetch(
        propertyId
          ? `/api/properties/${propertyId}`
          : "/api/properties",
        {
          method: propertyId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(propertyPayload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create property."
        );
      }

      const savedPropertyId: string = data.property.id;
      setPropertyId(savedPropertyId);


      const pendingImages = images.filter((image) => image.file);

      for (const [index, image] of pendingImages.entries()) {
        if (!image.file) continue;

        const formData = new FormData();
        formData.append("file", image.file);
        formData.append(
          "sortOrder",
          String(images.findIndex((item) => item === image))
        );

        const imageResponse = await fetch(
          `/api/properties/${savedPropertyId}/images`,
          {
            method: "POST",
            body: formData,
          }
        );

        const imageData = await imageResponse.json();

        if (!imageResponse.ok) {
          throw new Error(
            imageData.message ||
            `Unable to upload image ${index + 1}.`
          );
        }

        setImages((current) =>
          current.map((item) =>
            item === image
              ? {
                preview: imageData.image.url,
                id: imageData.image.id,
                url: imageData.image.url,
                storageKey: imageData.image.storageKey,
              }
              : item
          )
        );
      }


      // Generate the assessment using the server-side API.
      const assessmentResponse = await fetch(
        `/api/properties/${savedPropertyId}/assessment`,
        {
          method: "POST",
        },
      );

      const assessmentData = await assessmentResponse.json();

      if (!assessmentResponse.ok) {
        throw new Error(
          assessmentData.error || "Unable to generate property assessment.",
        );
      }

      const serverAssessment = assessmentData.assessment;

      // Prepare explanations for the existing assessment panel.
      const issues: string[] = [];

      if (images.length < 3) {
        issues.push(
          "Add at least three photos, including one exterior shot.",
        );
      }

      if (serverAssessment.listedRentOutsideRange) {
        issues.push(
          "Listed rent is outside the estimated range. Admin review will be required.",
        );
      }

      if (amenities.length < 3) {
        issues.push(
          "List the building amenities tenants filter by.",
        );
      }

      if (form.description.trim().length < 140) {
        issues.push(
          "Expand the description with floor, facing and nearby landmarks.",
        );
      }

      setAssessment({
        score: serverAssessment.trustScore,
        signals: serverAssessment.signals,
        issues,
        estimate: serverAssessment.estimate,
        listed: Number(form.rent),
      });

      toast.success("Property assessment completed", {
        description: `Server-generated Trust Score: ${serverAssessment.trustScore}/100.`,
      });
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

  const handleSubmitForReview = async () => {
    if (!propertyId || !assessment) {
      toast.error("Save the property and generate its assessment first.");
      return;
    }

    if (assessment.score < 75) {
      toast.error("Your Trust Score must be at least 75 to submit.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/submit`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit property for review."
        );
      }

      setSubmitted(true);

      toast.success("Property submitted for Admin review.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to submit property."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity],
    );

    setAssessment(null);
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

    setAssessment(null);

    // Allows selecting the same file again later.
    event.target.value = "";
  };
  const removeImage = async (index: number) => {
    const image = images[index];

    if (!image) return;

    // If the image is already saved, delete it from the backend first.
    if (image.id) {
      if (!propertyId) {
        toast.error("Property ID is missing.");
        return;
      }

      try {
        const response = await fetch(
          `/api/properties/${propertyId}/images`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageId: image.id,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to delete image."
          );
        }

        toast.success("Image deleted successfully.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to delete image."
        );
        return;
      }
    }

    // Remove from the UI only after backend deletion succeeds.
    if (image.file) {
      URL.revokeObjectURL(image.preview);
    }

    setImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index)
    );

    setAssessment(null);
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

          {/* Save Draft and Submit for Review */}
          {submitted ? (
            <div className="rounded-lg border border-border bg-muted p-4 text-center">
              <ShieldCheck className="mx-auto mb-2 size-6" />
              <p className="font-semibold">Submitted for Admin Review</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your property is awaiting Admin approval.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                {loading ? "Saving and generating assessment…" : "Save"}
              </Button>

              {assessment && assessment.score >= 75 && (
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={loading || !propertyId}
                  onClick={handleSubmitForReview}
                >
                  Submit for Review
                </Button>
              )}
            </div>
          )}
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