import z from "zod";
import { InternStatus } from "@/generated/prisma/enums";

export const createInternSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().min(1, "NIK wajib diisi"),
  institution: z.string().min(1, "Institusi wajib diisi"),
  phone: z.string().optional(),
  email: z.email({ error: "Email tidak valid" }).optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  periodStart: z.coerce.date({ error: "Tanggal mulai wajib diisi" }),
  periodEnd: z.coerce.date({ error: "Tanggal selesai wajib diisi" }),
  status: z.nativeEnum(InternStatus).optional().default(InternStatus.active),
});

export const updateInternSchema = createInternSchema.partial();

export type CreateInternInput = z.infer<typeof createInternSchema>;
export type UpdateInternInput = z.infer<typeof updateInternSchema>;
