import { IssueGetPayload } from "@/generated/prisma/models";

const issueInclude = {
  supervisor: {
    select: {
      id: true,
      nip: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  },
  internProfile: {
    select: {
      id: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  },
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      logbooks: true,
    },
  },
} as const;

export type Issue = IssueGetPayload<{
  include: typeof issueInclude;
}>;

export { issueInclude };
