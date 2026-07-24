import { betterAuth } from "better-auth";

import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin, username } from "better-auth/plugins";
import { ac, admin, hr, intern, supervisor } from "@/lib/auth/permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: { enabled: true },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
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
      bannedUserMessage: "Masa magang telah berakhir. Silakan hubungi HR.",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
