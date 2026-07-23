import z from "zod";

import { InternStatus } from "@/generated/prisma/enums";
import type { Intern } from "../types/intern-types";

const baseFields = {
  name: z.string().min(1, "Nama wajib diisi"),
  institution: z.string().min(1, "Institusi wajib diisi"),
  phone: z
    .string()
    .trim()
    .regex(
      /^08[0-9]{7,18}$/,
      "Nomor telepon harus diawali 08 dan hanya berisi angka",
    )
    .min(9, "Nomor telepon tidak valid")
    .max(20, "Nomor telepon maksimal 20 karakter"),
  nik: z
    .string()
    .trim()
    .regex(/^\d+$/, { message: "NIP hanya boleh berisi angka" })
    .min(16, "Nomor Induk Penduduk Tidak Valid")
    .max(16, "Nomor Induk Penduduk Tidak Valid"),
  email: z.email({ error: "Email tidak valid" }).min(1, "Email wajib diisi"),
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

export interface CreateInternResult {
  user: Intern;
  generatedPassword: string;
}
