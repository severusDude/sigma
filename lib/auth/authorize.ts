import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requirePermission(permission: {
  [resource: string]: string[];
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const { success: permitted } = await auth.api.userHasPermission({
    body: { permissions: permission, userId: session.user.id },
  });
  if (!permitted) {
    throw new Error("Forbidden");
  }

  return session;
}
