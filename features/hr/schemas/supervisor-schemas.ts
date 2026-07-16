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

export type CreateSupervisorInput = z.infer<typeof createSupervisorSchema>;
export type UpdateSupervisorInput = z.infer<typeof updateSupervisorSchema>;
