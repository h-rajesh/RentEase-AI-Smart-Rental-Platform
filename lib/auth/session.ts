import { SignJWT,jwtVerify} from "jose";

const secret = process.env.AUTH_SECRET;

if(!secret){
    throw new Error("AUTH_SECRET is not configured");
}

const secretKey = new TextEncoder().encode(secret);

export type SessionPayLoad = {
    userId : string;
    role : "LANDLORD" | "TENANT" | "ADMIN"
}

export async function createSession(
    payload : SessionPayLoad
) {
    return new SignJWT({
        userId : payload.userId,
        role : payload.role
    })
    .setProtectedHeader({
        alg : "HS256"
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey)
}

export async function verifySession(token : string){
    try {
        const { payload } = await jwtVerify(
            token,
            secretKey
        );

        if(
            typeof payload.userId !== "string" ||
            typeof payload.role !== "string"
        ) {
            return null;
        }

        return {
            userId : payload.userId,
            role : payload.role as SessionPayLoad["role"],
        }
    } catch (error) {
        return null;
    }
}