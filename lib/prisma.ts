import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getConnectionString() {
  return process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URI;
}
const connectionString = getConnectionString();

declare const globalThis: {
  prismaGlobal?: PrismaClient;
  poolGlobal?: Pool;
  cachedConnectionString?: string;
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
  if (!globalThis.poolGlobal || globalThis.cachedConnectionString !== connectionString) {
    if (globalThis.poolGlobal) {
      globalThis.poolGlobal.end().catch(() => {});
    }
    globalThis.cachedConnectionString = connectionString;
    globalThis.poolGlobal = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 15000,
    });
    const adapter = new PrismaPg(globalThis.poolGlobal);
    globalThis.prismaGlobal = new PrismaClient({ adapter });
  }
  pool = globalThis.poolGlobal;
  prisma = globalThis.prismaGlobal!;
}

export default prisma;
