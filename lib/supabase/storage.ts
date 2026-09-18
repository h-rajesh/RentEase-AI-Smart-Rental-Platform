import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const BUCKET_NAME = "property-images";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function uploadPropertyImage(
  file: File,
  propertyId: string,
) {
  const supabase = createSupabaseBrowserClient();

  const fileExtension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const fileName = `${crypto.randomUUID()}.${fileExtension}`;
  const filePath = `${propertyId}/${fileName}`;

  // 1. Attempt upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (!uploadError) {
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      storageKey: filePath,
    };
  }

  console.warn("Supabase storage upload initial attempt failed:", uploadError);

  // 2. Attempt bucket creation if missing, then retry upload once
  try {
    const { error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      { public: true }
    );

    if (!createError) {
      const { error: retryError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (!retryError) {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        return {
          url: publicUrl,
          storageKey: filePath,
        };
      }
    }
  } catch (err) {
    console.warn("Failed auto-creating Supabase bucket:", err);
  }

  // 3. Fallback: convert to Data URL if bucket does not exist or upload is prohibited
  console.warn(
    `Supabase bucket '${BUCKET_NAME}' not found or inaccessible. Falling back to inline data URL. ` +
      `To fix: Go to your Supabase Dashboard -> Storage -> Create a new public bucket named '${BUCKET_NAME}'.`
  );

  try {
    const dataUrl = await fileToDataUrl(file);
    return {
      url: dataUrl,
      storageKey: filePath,
    };
  } catch (fallbackErr) {
    console.error("Data URL conversion error:", fallbackErr);
    throw new Error("Unable to process property image.");
  }
}