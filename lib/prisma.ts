import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { createSoftDeleteExt } from "./prisma-soft-delete";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const extendedPrisma = prisma.$extends(createSoftDeleteExt());

export { extendedPrisma as prisma };
