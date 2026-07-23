import z from "zod";
import type { Supervisor } from "../types/supervisor-types";

const baseFields = {
  name: z.string().min(1, "Nama wajib diisi").max(250),
  nip: z
    .string()
    .trim()
    .length(18, { message: "NIP harus tepat 18 karakter" })
    .regex(/^\d+$/, { message: "NIP hanya boleh berisi angka" }),
  field: z.string().min(1, "Bidang wajib diisi"),
  phone: z
    .string()
    .trim()
    .min(9, "Nomor telepon tidak valid")
    .max(20, "Nomor telepon maksimal 20 karakter")
    .regex(
      /^08[0-9]{7,18}$/,
      "Nomor telepon harus diawali 08 dan hanya berisi angka",
    ),
  email: z.email({ error: "Email tidak valid" }).min(1, "Email wajib diisi"),
  maxInterns: z.number().int().min(1).max(50).default(5),
};

export const createSupervisorSchema = z.object({
  ...baseFields,
});

export const updateSupervisorSchema = createSupervisorSchema.partial();

export const assignMultipleSchema = z.object({
  supervisorProfileId: z.string().min(1, "Supervisor wajib dipilih"),
  interns: z
    .array(
      z.object({
        internProfileId: z.string().min(1, "Intern wajib dipilih"),
      }),
    )
    .min(1, "Minimal pilih satu intern"),
});

export type CreateSupervisorInput = z.infer<typeof createSupervisorSchema>;
export type UpdateSupervisorInput = z.infer<typeof updateSupervisorSchema>;
export type AssignMultipleInput = z.infer<typeof assignMultipleSchema>;

export interface CreateSupervisorResult {
  user: Supervisor;
  generatedPassword: string;
}
