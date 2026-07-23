import z from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const logbookFormSchema = z
  .object({
    date: z.date({ message: "Tanggal wajib diisi" }),
    activity: z.string().min(1, "Kegiatan wajib diisi"),
    startTime: z.string().regex(timeRegex, "Format jam tidak valid"),
    endTime: z.string().regex(timeRegex, "Format jam tidak valid"),
    issueId: z.string().optional().or(z.literal("")),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      const duration = eh * 60 + em - (sh * 60 + sm);
      return duration > 0 && duration <= 480;
    },
    { message: "Durasi maksimal 480 menit (8 jam)", path: ["endTime"] },
  );

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

export type LogbookFormInput = z.infer<typeof logbookFormSchema>;
export type CreateLogbookInput = z.infer<typeof createLogbookSchema>;
export type UpdateLogbookInput = z.infer<typeof updateLogbookSchema>;
