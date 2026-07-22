import { UserGetPayload } from "@/generated/prisma/models";

const documentInclude = {
  internProfile: {
    include: {
      department: true,
    },
  },
} as const;

export type DocumentRow = UserGetPayload<{ include: typeof documentInclude }>;

export type GenerateDocResult = {
  internId: string;
  internName: string;
  docNumber: string | null;
  filePath: string | null;
  error?: string;
};

export { documentInclude };
