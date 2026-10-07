export const roleHome: Record<string, string> = {
  admin: "/admin",
  hr: "/hr",
  supervisor: "/supervisor",
  intern: "/intern",
};

export function getRoleHome(role: string): string {
  // Fallback "/" (landing publik) — JANGAN "/sign-in" agar tidak loop
  // /sign-in → (ada session) → ... untuk role yang tidak dikenal.
  return roleHome[role] ?? "/";
}
