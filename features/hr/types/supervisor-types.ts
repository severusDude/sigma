import { UserGetPayload } from "@/generated/prisma/models";

const supervisorInclude = {
  supervisorProfile: {
    include: {
      team: { select: { name: true } },
      internAssignments: {
        where: { endedAt: null },
      },
    },
  },
} as const;

export type Supervisor = UserGetPayload<{ include: typeof supervisorInclude }>;

export { supervisorInclude };

export interface UnassignedIntern {
  id: string;
  name: string;
  institution: string;
  teamName: string | null;
}

export interface ActiveSupervisorOption {
  id: string;
  name: string;
  nip: string;
  currentCount: number;
  maxInterns: number;
}

export interface AssignedIntern {
  internProfileId: string;
  internName: string;
  nim: string;
  institution: string;
  teamName: string | null;
  assignedAt: string;
}

export interface ReassignAllResult {
  success: boolean;
  count: number;
  error?: string;
}

export type AssignResult =
  | { success: true; warning?: string }
  | { success: false; error: string };
