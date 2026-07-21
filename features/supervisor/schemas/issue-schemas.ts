import z from "zod";

import { IssueStatus } from "@/generated/prisma/enums";

export const issueFormSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  internProfileId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z
    .enum(Object.values(IssueStatus) as [string, ...string[]])
    .optional(),
});

export const createIssueSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  internProfileId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const updateIssueSchema = createIssueSchema.partial().extend({
  status: z
    .enum(Object.values(IssueStatus) as [string, ...string[]])
    .optional(),
});

export type IssueFormInput = z.infer<typeof issueFormSchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
