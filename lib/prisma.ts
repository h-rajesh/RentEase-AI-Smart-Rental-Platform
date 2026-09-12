import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URI;

declare const globalThis: {
  prismaGlobal?: PrismaClient;
  poolGlobal?: Pool;
} & typeof global;

let pool: Pool;
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 15000,
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.poolGlobal) {
    globalThis.poolGlobal = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 15000,
    });
  }
  pool = globalThis.poolGlobal;

  if (!globalThis.prismaGlobal) {
    const adapter = new PrismaPg(pool);
    globalThis.prismaGlobal = new PrismaClient({ adapter });
  }
  prisma = globalThis.prismaGlobal;
}

export default prisma;
