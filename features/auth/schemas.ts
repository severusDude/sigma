import z from "zod";

// TODO: Localization
export const signInSchema = z.object({
  email: z.email({ error: "Email tidak valid" }).min(1, "Email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type SignInSchema = z.infer<typeof signInSchema>;
