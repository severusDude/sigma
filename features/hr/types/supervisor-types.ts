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
