import { betterAuth } from "better-auth";

import { prisma } from "@/lib/prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin, username } from "better-auth/plugins";
import { Role } from "@/generated/prisma/enums";
import { ac, intern, supervisor, hr, admin } from "@/lib/auth/permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: "http://localhost:3000/",
  emailAndPassword: { enabled: true },
  plugins: [
    username(),
    adminPlugin({
      ac,
      roles: {
        [Role.intern]: intern,
        [Role.supervisor]: supervisor,
        [Role.hr]: hr,
        [Role.admin]: admin,
      },
      defaultRole: Role.intern,
      adminRoles: [Role.admin],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
