import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getConnectionString() {
  return process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.DATABASE_URI;
}
const connectionString = getConnectionString();

declare const globalThis: {
  prismaGlobal?: PrismaClient;
  poolGlobal?: Pool;
  cachedConnectionString?: string;
} & typeof global;

function createPool(connString: string | undefined): Pool {
  const p = new Pool({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    statement_timeout: 15000,
    query_timeout: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  p.on("error", (err) => {
    // Handle unexpected socket closes on idle pooled clients cleanly
    console.warn("PostgreSQL pool idle client warning:", err.message);
  });

  return p;
}

let pool: Pool;
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  pool = createPool(connectionString);
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.poolGlobal || globalThis.cachedConnectionString !== connectionString) {
    if (globalThis.poolGlobal) {
      globalThis.poolGlobal.end().catch(() => {});
    }
    globalThis.cachedConnectionString = connectionString;
    globalThis.poolGlobal = createPool(connectionString);
    const adapter = new PrismaPg(globalThis.poolGlobal);
    globalThis.prismaGlobal = new PrismaClient({ adapter });
  }
  pool = globalThis.poolGlobal;
  prisma = globalThis.prismaGlobal!;
}

export default prisma;
