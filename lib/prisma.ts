import "dotenv/config";

import { Pool } from "pg";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import { createSoftDeleteExt } from "@/lib/prisma-soft-delete";

// pg-connection-string >= 2.10 treats 'prefer'/'require'/'verify-ca' as aliases
// for 'verify-full' (and warns); v3 / pg v9 will adopt weaker libpq semantics.
// Normalize explicitly to preserve today's verified behavior. URLs without
// sslmode (local non-SSL) and explicit 'disable'/'no-verify' are left alone.
const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

export function normalizePostgresSslmode(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  const mode = url.searchParams.get("sslmode");
  if (!mode || !LEGACY_SSL_MODES.has(mode.toLowerCase())) {
    return raw;
  }
  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}

const rawConnectionString = `${process.env.DATABASE_URL}`;
const normalizedConnectionString = normalizePostgresSslmode(rawConnectionString);
if (normalizedConnectionString !== rawConnectionString) {
  const mode = (() => {
    try {
      return new URL(rawConnectionString).searchParams.get("sslmode");
    } catch {
      return "unknown";
    }
  })();
  console.warn(
    `[db] sslmode '${mode}' is deprecated (pg v9 adopts weaker libpq semantics); using 'verify-full' instead. ` +
      `Set DATABASE_URL with '?sslmode=verify-full' to silence this notice.`,
  );
}

// NOTE: do not pass a separate `ssl` object alongside a connection string
// containing sslmode — node-postgres lets connection-string params overwrite
// the `ssl` object (see node-postgres docs "SSL > Usage with connectionString").
const pool = new Pool({
  connectionString: normalizedConnectionString,
  max: 5,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const extendedPrisma = prisma.$extends(createSoftDeleteExt());

export { extendedPrisma as prisma };
