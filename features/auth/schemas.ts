import z from "zod";

// TODO: Localization
export const signInSchema = z.object({
  email: z.email({ error: "Email tidak valid" }).min(1, "Email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const setPasswordSchema = z
  .object({
    userId: z.string().min(1, "User wajib dipilih"),
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type SignInSchema = z.infer<typeof signInSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
