import { requireRole } from "@/lib/auth/authorization";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
    params : Promise<{
        propertyId : string;
    }>
}

export async function POST(
    req : Request,
    context : RouteContext
) {
   try {
    const { user , error } = await requireRole([
        "LANDLORD"
    ])

    if(error === "UNAUTHORIZED"){
        return NextResponse.json(
            {error : "Authentication required"},
            {status : 401}
        )
    }

    if(error === "FORBIDDEN"){
        return NextResponse.json(
            {message : "Only landlords can add property images."},
            {status : 403}
        )
    }

    const {propertyId} = await context.params;

    const property = await prisma.property.findFirst({
        where : {
            id : propertyId,
            ownerId : user.id,
        },
        select : {
            id : true
        }
    });

    if(!property){
        return NextResponse.json(
            {message : "Property not found or you do not have permission to modify it "},
            {status : 404}
        )
    }

    const body = await req.json();

    const { url,storageKey,sortOrder } = body;

    if(
        typeof url !=="string" || 
        !url.trim() ||
        typeof storageKey !== "string" ||
        !storageKey.trim()
    ) {
       return NextResponse.json(
        {message : "Image URL and storage key are required."},
        {status : 400}
       )
    }

    const image = await prisma.propertyImage.create({
        data : {
            propertyId : property.id,
            url : url.trim(),
            storageKey : storageKey.trim(),
            sortOrder :
             typeof sortOrder === "number" ?sortOrder : 0
        }
    });

    return NextResponse.json(
        {message : "Property image saved successfully",image},
        {status : 201}
    )
   } catch (error) {
    console.error("Save property image error",error);

    return NextResponse.json(
        {message : "Unable to save property image."},
        {status : 500}
    )
    
   }
}