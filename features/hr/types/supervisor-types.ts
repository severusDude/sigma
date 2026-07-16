import { UserGetPayload } from "@/generated/prisma/models";

const supervisorInclude = {
  supervisorProfile: {
    include: {
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
  departmentName: string | null;
}

export interface ActiveSupervisorOption {
  id: string;
  name: string;
  nip: string;
  currentCount: number;
  maxInterns: number;
}

export type AssignResult =
  | { success: true; warning?: string }
  | { success: false; error: string };
