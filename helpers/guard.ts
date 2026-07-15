import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Role } from "@/generated/prisma/enums"
import type { User } from "better-auth"
import { getRoleHome } from "@/helpers/role-home"

export async function requireAuth(allowedRoles?: Role[]): Promise<{ user: User }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect("/sign-in")

  const role = session.user.role as Role

  if (allowedRoles && !allowedRoles.includes(role)) {
    redirect(getRoleHome(role))
  }

  return { user: session.user }
}

export async function redirectToRoleHome(): Promise<never> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect("/sign-in")

  redirect(getRoleHome(session.user.role as Role))
}
