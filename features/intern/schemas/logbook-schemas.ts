import z from "zod";

export const createLogbookSchema = z.object({
  date: z.date({ message: "Tanggal wajib diisi" }),
  activity: z.string().min(1, "Kegiatan wajib diisi"),
  duration: z
    .number({ message: "Durasi wajib diisi" })
    .int("Durasi harus bilangan bulat")
    .positive("Durasi harus lebih dari 0")
    .max(480, "Durasi maksimal 480 menit (8 jam)"),
  issueId: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const updateLogbookSchema = createLogbookSchema.partial();

export type CreateLogbookInput = z.infer<typeof createLogbookSchema>;
export type UpdateLogbookInput = z.infer<typeof updateLogbookSchema>;
