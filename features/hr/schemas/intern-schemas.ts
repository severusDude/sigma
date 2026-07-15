import z from "zod";

import { InternStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/browser";

const baseFields = {
  name: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().min(1, "NIK wajib diisi"),
  institution: z.string().min(1, "Institusi wajib diisi"),
  phone: z.string().optional(),
  email: z.email({ error: "Email tidak valid" }).optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  status: z
    .enum(Object.values(InternStatus) as [string, ...string[]])
    .default(InternStatus.active),
};

export const createInternSchema = z.object({
  ...baseFields,
  periodStart: z.date({ message: "Tanggal mulai wajib diisi" }),
  periodEnd: z.date({ message: "Tanggal selesai wajib diisi" }),
});

export const updateInternSchema = createInternSchema.partial();

export type CreateInternInput = z.infer<typeof createInternSchema>;
export type UpdateInternInput = z.infer<typeof updateInternSchema>;
