import "dotenv/config";

import { Pool } from "pg";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import { createSoftDeleteExt } from "@/lib/prisma-soft-delete";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const extendedPrisma = prisma.$extends(createSoftDeleteExt());

export { extendedPrisma as prisma };
