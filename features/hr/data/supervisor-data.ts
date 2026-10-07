import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";

import { supervisorInclude } from "../types/supervisor-types";
import type {
  UnassignedIntern,
  ActiveSupervisorOption,
  AssignedIntern,
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
                  team: { name: { contains: query, mode: "insensitive" } },
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
      team: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return interns.map((i) => ({
    id: i.id,
    name: i.user.name,
    institution: i.institution,
    teamName: i.team?.name ?? null,
  }));
}

export async function fetchSupervisorInterns(
  supervisorProfileId: string,
): Promise<AssignedIntern[]> {
  const assignments = await prisma.internSupervisor.findMany({
    where: {
      supervisorProfileId,
      endedAt: null,
    },
    include: {
      internProfile: {
        include: {
          user: { select: { name: true } },
          team: { select: { name: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return assignments.map((a) => ({
    internProfileId: a.internProfileId,
    internName: a.internProfile.user.name,
    nim: a.internProfile.nik,
    institution: a.internProfile.institution,
    teamName: a.internProfile.team?.name ?? null,
    assignedAt: a.assignedAt.toISOString(),
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
