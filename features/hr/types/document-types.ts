import { UserGetPayload } from "@/generated/prisma/models";

const documentInclude = {
  internProfile: {
    include: {
      department: true,
    },
  },
} as const;

export type DocumentRow = UserGetPayload<{ include: typeof documentInclude }>;

export { documentInclude };
