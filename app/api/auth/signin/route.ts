import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";



export async function POST(req : Request){
    try {
        const body = await req.json();

        const { email,password,role } = body;

        if(!email || !password || !role){
            return NextResponse.json(
                {message : "Email,password and role are required"},
                {status : 400}
            )
        }

        if(!["TENANT","LANDLORD","ADMIN"].includes(role)){
            return NextResponse.json(
                {error : "Invalid role"},
                {status : 400}
            )
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where : {
                email : normalizedEmail
            }
        })

        if(!user){
            return NextResponse.json(
                {message : "Invalid email or password."},
                {status : 401}
            )
        }
        const passwordValid = await verifyPassword(
            password,
            user.passwordHash
        );

        if(!passwordValid){
            return NextResponse.json(
                {message : "Invalid email or password"},
                {status : 401}
            )
        }

        if(user.role !== role){
            const expectedRoleName = user.role === "TENANT" ? "Tenant" : user.role === "LANDLORD" ? "Landlord" : "Admin";
            return NextResponse.json(
                {message : `This account is registered as a ${expectedRoleName}. Please select the ${expectedRoleName} tab to sign in.`},
                {status : 400}
            )
        }

        const sessionToken = await createSession({
            userId : user.id,
            role : user.role,
        })


        const response =  NextResponse.json(
            {
                message : "Signed in successfully",
                user : {
                    id : user.id,
                    name : user.name,
                    email : user.email,
                    phone : user.phone,
                    role : user.role,
                    createdAt : user.createdAt
                }
            },
            {status : 200}
        )

        response.cookies.set({
            name : "rentease_session",
            value : sessionToken,
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "lax",
            path : "/",
            maxAge : 60 * 60 * 24 * 7,
        })

        return response;
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {message : "Unable to signin"},
            {status : 500}
        )
        
    }
}