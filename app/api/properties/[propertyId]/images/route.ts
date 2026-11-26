
import { requireRole } from "@/lib/auth/authorization";
import prisma from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        propertyId: string;
    }>;
};

// ADD PROPERTY IMAGE

export async function POST(
    req: Request,
    context: RouteContext
) {
    let uploadedStorageKey: string | null = null;

    try {
        const { user, error } = await requireRole(["LANDLORD"]);

        if (error === "UNAUTHORIZED") {
            return NextResponse.json(
                { message: "Authentication required." },
                { status: 401 }
            );
        }

        if (error === "FORBIDDEN") {
            return NextResponse.json(
                { message: "Only landlords can upload images." },
                { status: 403 }
            );
        }

        const { propertyId } = await context.params;

        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                ownerId: user.id,
                status: {
                    in: ["DRAFT", "REJECTED"],
                },
            },
            select: { id: true },
        });

        if (!property) {
            return NextResponse.json(
                { message: "Editable property not found or access denied." },
                { status: 404 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file");
        const sortOrder = Number(formData.get("sortOrder") ?? 0);

        if (!(file instanceof File)) {
            return NextResponse.json(
                { message: "An image file is required." },
                { status: 400 }
            );
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            return NextResponse.json(
                { message: "Only JPEG, PNG and WebP images are allowed." },
                { status: 400 }
            );
        }

        if (file.size === 0 || file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { message: "Image size must be between 1 byte and 5 MB." },
                { status: 400 }
            );
        }

        if (!Number.isInteger(sortOrder) || sortOrder < 0) {
            return NextResponse.json(
                { message: "Invalid image sort order." },
                { status: 400 }
            );
        }

        const extension = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        }[file.type];

        const storageKey = `${propertyId}/${crypto.randomUUID()}.${extension}`;
        uploadedStorageKey = storageKey;

        const supabase = createSupabaseAdminClient();

        const { error: uploadError } = await supabase.storage
            .from("property-images")
            .upload(storageKey, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type,
            });

        if (uploadError) {
            console.error("Supabase upload failed:", uploadError);

            return NextResponse.json(
                { message: "Supabase Storage upload failed." },
                { status: 500 }
            );
        }

        const { data } = supabase.storage
            .from("property-images")
            .getPublicUrl(storageKey);

        const image = await prisma.$transaction(async (tx) => {
            const savedImage = await tx.propertyImage.create({
                data: {
                    propertyId: property.id,
                    url: data.publicUrl,
                    storageKey,
                    sortOrder,
                },
            });

            await tx.property.update({
                where: { id: property.id },
                data: { updatedAt: new Date() },
            });

            return savedImage;
        });

        return NextResponse.json(
            {
                message: "Property image uploaded successfully.",
                image,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Property image upload error:", error);

        if (uploadedStorageKey) {
            try {
                const supabase = createSupabaseAdminClient();

                await supabase.storage
                    .from("property-images")
                    .remove([uploadedStorageKey]);
            } catch (cleanupError) {
                console.error("Storage cleanup failed:", cleanupError);
            }
        }

        return NextResponse.json(
            { message: "Unable to upload property image." },
            { status: 500 }
        );
    }
}


// DELETE PROPERTY IMAGE
export async function DELETE(
    req: Request,
    context: RouteContext
) {
    try {
        const { user, error } = await requireRole(["LANDLORD"]);

        if (error === "UNAUTHORIZED") {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        if (error === "FORBIDDEN") {
            return NextResponse.json(
                { message: "Only landlords can delete property images." },
                { status: 403 }
            );
        }

        const { propertyId } = await context.params;
        const body = await req.json();
        const { imageId } = body;

        if (typeof imageId !== "string" || !imageId.trim()) {
            return NextResponse.json(
                { message: "A valid image ID is required." },
                { status: 400 }
            );
        }

        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                ownerId: user.id,
            },
            select: {
                id: true,
                status: true,
            },
        });

        if (!property) {
            return NextResponse.json(
                { message: "Property not found or you do not have permission to modify it." },
                { status: 404 }
            );
        }

        if (
            property.status !== "DRAFT" &&
            property.status !== "REJECTED"
        ) {
            return NextResponse.json(
                { message: "Images can only be modified on draft or rejected properties." },
                { status: 409 }
            );
        }

        const image = await prisma.propertyImage.findFirst({
            where: {
                id: imageId,
                propertyId: property.id,
            },
        });

        if (!image) {
            return NextResponse.json(
                { message: "Image not found for this property." },
                { status: 404 }
            );
        }

        // Delete the stored file when it has a Supabase Storage key.
        
        // Delete the database record first, after rechecking ownership and status.
        await prisma.$transaction(async (tx) => {
            const currentProperty = await tx.property.findFirst({
                where: {
                    id: property.id,
                    ownerId: user.id,
                    status: {
                        in: ["DRAFT", "REJECTED"],
                    },
                },
                select: { id: true },
            });

            if (!currentProperty) {
                throw new Error("PROPERTY_NOT_EDITABLE");
            }

            const currentImage = await tx.propertyImage.findFirst({
                where: {
                    id: image.id,
                    propertyId: property.id,
                },
            });

            if (!currentImage) {
                throw new Error("IMAGE_NOT_FOUND");
            }

            await tx.propertyImage.delete({
                where: { id: currentImage.id },
            });

            await tx.property.update({
                where: { id: property.id },
                data: { updatedAt: new Date() },
            });
        });

        // Remove the physical file only after the database transaction succeeds.
        if (image.storageKey) {
            const supabase = createSupabaseAdminClient();

            const { error: storageError } = await supabase.storage
                .from("property-images")
                .remove([image.storageKey]);

            if (storageError) {
                console.error(
                    "Image database record deleted, but Supabase cleanup failed:",
                    storageError
                );

                // The database no longer references this image.
                // Storage cleanup can be retried separately.
                return NextResponse.json({
                    message: "Image removed from the property. Storage cleanup is pending.",
                    imageId: image.id,
                    cleanupPending: true,
                });
            }
        }

        return NextResponse.json({
            message: "Property image deleted successfully.",
            imageId: image.id,
            cleanupPending: false,
        });

    } catch (error) {
       if (error instanceof Error && error.message === "PROPERTY_NOT_EDITABLE") {
    return NextResponse.json(
        { message: "This property can no longer be edited." },
        { status: 409 }
    );
}

if (error instanceof Error && error.message === "IMAGE_NOT_FOUND") {
    return NextResponse.json(
        { message: "Image not found for this property." },
        { status: 404 }
    );
}
    }
}
