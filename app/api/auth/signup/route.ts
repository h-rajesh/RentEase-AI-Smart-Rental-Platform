import { hashPassword } from "@/lib/auth/password";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req : Request){
    try {
        const body = await req.json();

        const { name , email, phone , password, role} = body;

        if(!name || !email || !password || !role){
            return NextResponse.json(
                {error : "Name, email, password, and role are required."},
                {status : 400}
            )
        }
        if(!["TENANT","LANDLORD"].includes(role)){
            return NextResponse.json(
                { error : "Invalid role."},
                {status : 400}
            )
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where : {
                email : normalizedEmail
            }
        });

        if(existingUser){
            return NextResponse.json({
                error : "An account with this email already exists."
            },
        {
            status : 409
        })
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data : {
                name : name.trim(),
                email : normalizedEmail,
                phone : phone?.trim() || null,
                passwordHash,
                role,
            },
            select : {
                id : true,
                name : true,
                email : true,
                phone : true,
                role : true,
                createdAt : true,
            }
        })

        return NextResponse.json(
            { message : "Account created successfully"},
            {status : 201}
        )
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {error : "Unable to create account."},
            {status : 500}
        )
        
    }
}