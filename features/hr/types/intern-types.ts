import { UserGetPayload } from "@/generated/prisma/models";

const internInclude = {
  internProfile: {
    include: {
      supervisorAssignments: {
        where: { endedAt: null },
        include: {
          supervisorProfile: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  },
} as const;

export type Intern = UserGetPayload<{ include: typeof internInclude }>;

export { internInclude };
