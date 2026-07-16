import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";

import { supervisorInclude } from "../types/supervisor-types";
import type {
  UnassignedIntern,
  ActiveSupervisorOption,
} from "../types/supervisor-types";

export async function fetchSupervisors(query?: string) {
  "use cache";
  cacheTag("supervisors");

  return prisma.user.findMany({
    where: {
      supervisorProfile: { is: { deletedAt: null } },
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              {
                supervisorProfile: {
                  nip: { contains: query, mode: "insensitive" },
                },
              },
              {
                supervisorProfile: {
                  field: { contains: query, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    include: supervisorInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function fetchUnassignedInterns(): Promise<UnassignedIntern[]> {
  "use cache";
  cacheTag("interns");

  const interns = await prisma.internProfile.findMany({
    where: {
      deletedAt: null,
      status: "active",
      supervisorAssignments: {
        none: { endedAt: null },
      },
    },
    include: {
      user: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return interns.map((i) => ({
    id: i.id,
    name: i.user.name,
    institution: i.institution,
    departmentName: i.department?.name ?? null,
  }));
}

export async function fetchActiveSupervisorOptions(): Promise<ActiveSupervisorOption[]> {
  "use cache";
  cacheTag("supervisors");

  const supervisors = await prisma.supervisorProfile.findMany({
    where: { deletedAt: null, isActive: true },
    include: {
      user: { select: { name: true } },
      internAssignments: {
        where: { endedAt: null },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return supervisors.map((s) => ({
    id: s.id,
    name: s.user.name,
    nip: s.nip,
    currentCount: s.internAssignments.length,
    maxInterns: s.maxInterns,
  }));
}
