
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, ShieldCheck } from "lucide-react";
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

import { AssessmentPanel } from "@/components/rentease/landlord/AssessmentPanel";
import { FormField } from "@/components/rentease/landlord/FormField";

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

type PropertyImage = {
  id: string;
  url: string;
  storageKey?: string | null;
};

type ImageItem = {
  preview: string;
  file?: File;
  id?: string;
};

type Assessment = {
  score: number;
  signals: { label: string; score: number }[];
  issues: string[];
  estimate: { low: number; high: number; mid: number };
  listed: number;
};

const EMPTY_FORM: PropertyForm = {
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
};

export default function EditPropertyClient({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PropertyForm>(EMPTY_FORM);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProperty() {
      try {
        const response = await fetch(
          `/api/properties/${propertyId}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load property.");
        }

        const property = data.property ?? data;

        if (property.status !== "DRAFT") {
          throw new Error(
            "Only draft properties can be edited."
          );
        }

        if (!active) return;

        setForm({
          title: property.title ?? "",
          type: property.type ?? "Apartment",
          city: property.city ?? "Hyderabad",
          locality: property.locality ?? "",
          rent: String(property.rent ?? ""),
          area: String(property.area ?? ""),
          beds: String(property.bedrooms ?? 2),
          baths: String(property.bathrooms ?? 2),
          furnishing: property.furnishing ?? "Semi-furnished",
          description: property.description ?? "",
        });

        setAmenities(property.amenities ?? []);

        setImages(
          (property.images ?? []).map((image: PropertyImage) => ({
            id: image.id,
            preview: image.url,
          }))
        );
      } catch (error) {
        if (active) {
          setPageError(
            error instanceof Error
              ? error.message
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

  const updateField = (
    key: keyof PropertyForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setAssessment(null);

    setErrors((current) => ({
      ...current,
      [key]: "",
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity]
    );

    setAssessment(null);
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (form.title.trim().length < 5) {
      next.title = "Enter a descriptive property title.";
    }

    if (form.locality.trim().length < 3) {
      next.locality = "Enter the property locality.";
    }

    if (!form.rent || Number(form.rent) < 1000) {
      next.rent = "Enter a valid monthly rent.";
    }

    if (!form.area || Number(form.area) < 150) {
      next.area = "Enter a valid area in square feet.";
    }

    if (form.description.trim().length < 40) {
      next.description = "Description must contain at least 40 characters.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = Array.from(event.target.files ?? []);

    const validFiles = selected.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image.`);
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5 MB.`);
        return false;
      }

      return true;
    });

    const remaining = 10 - images.length;
    const filesToAdd = validFiles.slice(0, remaining);

    if (validFiles.length > remaining) {
      toast.error("A maximum of 10 images is allowed.");
    }

    setImages((current) => [
      ...current,
      ...filesToAdd.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);

    setAssessment(null);
    event.target.value = "";
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    if (!image) return;

    if (image.id) {
      try {
        const response = await fetch(
          `/api/properties/${propertyId}/images`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId: image.id }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to delete image.");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Image deletion failed."
        );
        return;
      }
    }

    if (image.file) {
      URL.revokeObjectURL(image.preview);
    }

    setImages((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );

    setAssessment(null);
  };

  const saveProperty = async () => {
    if (!validate()) return false;

    setSaving(true);
    setAssessment(null);

    try {
      const payload = {
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
        `/api/properties/${propertyId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save property.");
      }

      const newImages = images.filter((image) => image.file);

      for (const [index, image] of newImages.entries()) {
        if (!image.file) continue;

        const formData = new FormData();
        formData.append("file", image.file);
        formData.append(
          "sortOrder",
          String(images.indexOf(image))
        );

        const imageResponse = await fetch(
          `/api/properties/${propertyId}/images`,
          {
            method: "POST",
            body: formData,
          }
        );

        const imageData = await imageResponse.json();

        if (!imageResponse.ok) {
          throw new Error(
            imageData.message || `Unable to upload image ${index + 1}.`
          );
        }

        setImages((current) =>
          current.map((item) =>
            item === image
              ? {
                  id: imageData.image.id,
                  preview: imageData.image.url,
                }
              : item
          )
        );
      }

      toast.success("Property details saved.", {
        description: "Generate a fresh assessment before submitting.",
      });

      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save property."
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveProperty();
  };

  const handleAssess = async () => {
    const saved = await saveProperty();
    if (!saved) return;

    setAssessing(true);

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/assessment`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Assessment failed.");
      }

      const result = data.assessment;
      const issues: string[] = [];

      if (images.length < 3) {
        issues.push("Add at least three property photos.");
      }

      if (result.listedRentOutsideRange) {
        issues.push(
          "Listed rent is outside the estimated range. Admin review will be required."
        );
      }

      if (amenities.length < 3) {
        issues.push("Add more relevant property amenities.");
      }

      if (form.description.trim().length < 140) {
        issues.push("Expand the description with more property details.");
      }

      setAssessment({
        score: result.trustScore,
        signals: result.signals,
        issues,
        estimate: result.estimate,
        listed: Number(form.rent),
      });

      toast.success(
        `New Trust Score: ${result.trustScore}/100`
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Assessment failed."
      );
    } finally {
      setAssessing(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!assessment || assessment.score < 75) {
      toast.error("A current Trust Score of at least 75 is required.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/submit`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit property.");
      }

      setSubmitted(true);
      toast.success("Property submitted for Admin review.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Submission failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h2 className="text-xl font-semibold">Unable to edit property</h2>
        <p className="mt-2 text-sm text-muted-foreground">{pageError}</p>
        <Button className="mt-5">
          <Link href="/dashboard/landlord">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <DashboardShell
      role="Landlord"
      title="Edit property"
      subtitle="Update your draft listing. Any changes require a fresh Trust Score assessment."
      nav={[
        { label: "Overview", href: "/dashboard/landlord" },
        { label: "Add Property", href: "/dashboard/landlord/add" },
        { label: "Properties", href: "/dashboard/landlord" },
      ]}
      actions={
        <Button variant="outline">
          <Link href={`/dashboard/landlord/properties/${propertyId}`}>
            Back to property
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <form
          onSubmit={handleSave}
          className="surface-panel space-y-5 p-6 sm:p-7"
        >
          <FormField label="Property title" error={errors.title}>
            <Input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Property type">
              <Select
                value={form.type}
                onValueChange={(value) => value && updateField("type", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="City">
              <Select
                value={form.city}
                onValueChange={(value) => value && updateField("city", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Locality" error={errors.locality}>
              <Input
                value={form.locality}
                onChange={(e) => updateField("locality", e.target.value)}
              />
            </FormField>

            <FormField label="Monthly rent (₹)" error={errors.rent}>
              <Input
                inputMode="numeric"
                value={form.rent}
                onChange={(e) =>
                  updateField("rent", e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </FormField>

            <FormField label="Area (sq ft)" error={errors.area}>
              <Input
                inputMode="numeric"
                value={form.area}
                onChange={(e) =>
                  updateField("area", e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </FormField>

            <FormField label="Furnishing">
              <Select
                value={form.furnishing}
                onValueChange={(value) =>
                  value && updateField("furnishing", value)
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FURNISHING.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Bedrooms">
              <Select
                value={form.beds}
                onValueChange={(value) => value && updateField("beds", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5"].map((item) => (
                    <SelectItem key={item} value={item}>{item} BHK</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Bathrooms">
              <Select
                value={form.baths}
                onValueChange={(value) => value && updateField("baths", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4"].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Amenities">
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => {
                const active = amenities.includes(amenity);

                return (
                  <label
                    key={amenity}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                      active
                        ? "border-primary/40 bg-accent"
                        : "border-border bg-card"
                    )}
                  >
                    <Checkbox
                      checked={active}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    {amenity}
                  </label>
                );
              })}
            </div>
          </FormField>

          <FormField label="Description" error={errors.description}>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </FormField>

          <FormField label="Property images">
            <div className="flex flex-wrap gap-3">
              {images.map((image, index) => (
                <div
                  key={image.id ?? image.preview}
                  className="relative size-24 overflow-hidden rounded-lg border"
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
                  onClick={() => fileInputRef.current?.click()}
                  className="grid size-24 place-items-center rounded-lg border border-dashed"
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
              Up to 10 images. Maximum 5 MB per image.
            </p>
          </FormField>

          {submitted ? (
            <div className="rounded-lg border p-4 text-center">
              <ShieldCheck className="mx-auto mb-2 size-6" />
              <p className="font-semibold">Submitted for Admin review</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={saving || assessing || submitting}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Changes
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={saving || assessing || submitting}
                onClick={handleAssess}
              >
                {assessing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Reassess Property
              </Button>

              {assessment && assessment.score >= 75 && (
                <Button
                  type="button"
                  className="w-full"
                  disabled={saving || assessing || submitting}
                  onClick={handleSubmitForReview}
                >
                  {submitting ? "Submitting…" : "Submit for Review"}
                </Button>
              )}
            </div>
          )}
        </form>

        <div className="lg:sticky lg:top-24">
          {assessment ? (
            <AssessmentPanel assessment={assessment} />
          ) : (
            <Panel
              title="Listing Trust Assessment"
              description="Save your changes, then generate a fresh assessment."
            >
              <Disclaimer>
                Any property changes invalidate the previous assessment.
                A Trust Score of at least 75 is required before submission.
                This assessment does not verify ownership or legal title.
              </Disclaimer>
            </Panel>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
