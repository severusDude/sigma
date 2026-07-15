import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const softDeleteModels = [
  "department",
  "internProfile",
  "supervisorProfile",
  "issue",
  "logbook",
  "attendance",
  "guidanceSession",
  "assessment",
  "document",
  "guide",
] as const;

prisma.$use(async (params, next) => {
  if (
    softDeleteModels.includes(params.model as typeof softDeleteModels[number])
  ) {
    if (params.action === "findUnique" || params.action === "findFirst") {
      params.action = "findFirst";
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    if (params.action === "findMany") {
      params.args.where = { ...params.args.where, deletedAt: null };
    }
  }
  return next(params);
});

export { prisma };
