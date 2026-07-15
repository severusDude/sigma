export const roleHome: Record<string, string> = {
  admin: "/admin",
  hr: "/hr/dashboard",
  supervisor: "/supervisor",
  intern: "/intern",
}

export function getRoleHome(role: string): string {
  return roleHome[role] ?? "/sign-in"
}
