import { LogbookGetPayload } from "@/generated/prisma/models";

const logbookInclude = {
  issue: {
    select: {
      id: true,
      title: true,
    },
  },
} as const;

export type Logbook = LogbookGetPayload<{
  include: typeof logbookInclude;
}>;

export { logbookInclude };
