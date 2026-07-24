import { LogbookGetPayload } from "@/generated/prisma/models";

const logbookInclude = {
  issue: {
    select: {
      id: true,
      title: true,
    },
  },
  attachments: {
    where: { attachableType: "logbook" },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
    },
  },
} as const;

export type Logbook = LogbookGetPayload<{
  include: typeof logbookInclude;
}>;

export { logbookInclude };
