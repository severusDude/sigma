import z from "zod";

const baseFields = {
  name: z.string().min(1, "Nama wajib diisi"),
  nip: z.string().min(1, "NIP wajib diisi"),
  field: z.string().min(1, "Bidang wajib diisi"),
  phone: z.string().optional(),
  email: z.email({ error: "Email tidak valid" }).optional().or(z.literal("")),
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
