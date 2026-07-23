# RBAC — Role-Based Access Control Design

**Project**: SIGMA (Sistem Informasi Management Magang)
**Date**: 2026-07-14
**Status**: Draft
**Author**: opencode agent

---

## 1. Overview

Implement hierarchical Role-Based Access Control (RBAC) for 4 roles — Admin, HR, Supervisor, Intern — using Better-Auth's admin plugin with custom roles and fine-grained permissions. Role field stored as a Prisma enum for type safety.

---

## 2. Prisma Schema

### Enum

```prisma
enum Role {
  admin
  hr
  supervisor
  intern
}
```

### User Model Update

```
- role    String?
+ role    Role?
```

Existing DB values (`admin`, `user`, etc.) will be migrated to the new enum format.

---

## 3. Permission Statement

File: `lib/auth/permissions.ts`

```typescript
const statement = {
  user:       ["create", "list", "set-role", "impersonate"],
  system:     ["manage"],
  audit_log:  ["read"],
  intern:     ["create", "read", "update", "delete"],
  supervisor: ["create", "read", "update", "delete"],
  assignment: ["create", "read", "update", "delete"],
  dashboard:  ["view-full", "view-operational", "view-limited"],
  document:   ["create", "read"],
  report:     ["create", "read"],
  logbook:    ["review", "approve", "read"],
  assessment: ["create", "read", "update", "finalize"],
  journal:    ["create", "read", "update"],
  attendance: ["create", "read"],
  info:       ["read"],
  download:   ["read"],
} as const
```

### Resource Mapping

| Resource | Description |
|----------|-------------|
| `user` | Create/list/set-role users (admin only) |
| `system` | System configuration (admin only) |
| `audit_log` | Read audit trail (admin only) |
| `intern` | CRUD intern data (Admin, HR) |
| `supervisor` | CRUD supervisor data (Admin, HR) |
| `assignment` | Assign supervisor→intern (Admin, HR) |
| `dashboard` | 3 tiers: full (Admin), operational (HR), limited (Supervisor) |
| `document` | Generate certificates, reports (Admin, HR) |
| `report` | Export/reporting (Admin, HR) |
| `logbook` | Review/approve intern logbooks (Supervisor, Admin) |
| `assessment` | Evaluate interns (Supervisor, Admin) |
| `journal` | Fill own logbook (Intern) |
| `attendance` | Check-in/out (Intern) |
| `info` | View orientation info (Intern) |
| `download` | Download own documents (Intern) |

---

## 4. Role Definitions

Hierarchical — each higher role includes all permissions of roles below it via spread operator.

```typescript
export const intern = ac.newRole({
  journal:    ["create", "read", "update"],
  attendance: ["create", "read"],
  info:       ["read"],
  download:   ["read"],
})

export const supervisor = ac.newRole({
  logbook:    ["review", "approve", "read"],
  assessment: ["create", "read", "update"],
  dashboard:  ["view-limited"],
  ...intern,
})

export const hr = ac.newRole({
  intern:     ["create", "read", "update", "delete"],
  supervisor: ["create", "read", "update", "delete"],
  assignment: ["create", "read", "update", "delete"],
  document:   ["create", "read"],
  report:     ["create", "read"],
  dashboard:  ["view-operational"],
  ...supervisor,
})

export const admin = ac.newRole({
  user:       ["create", "list", "set-role", "impersonate"],
  system:     ["manage"],
  audit_log:  ["read"],
  dashboard:  ["view-full"],
  ...hr,
})
```

### Role↔Level Mapping

| Role | Level | DB Value |
|------|-------|----------|
| Admin | 4 (highest) | `admin` |
| HR | 3 | `hr` |
| Supervisor | 2 | `supervisor` |
| Intern | 1 (lowest) | `intern` |

---

## 5. Better-Auth Configuration

File: `lib/auth.ts`

```typescript
import { Role } from "@/generated/prisma/enums"
import { ac, intern, supervisor, hr, admin } from "@/lib/auth/permissions"

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
})
```

Key config:
- `defaultRole: Role.intern` — newly created users get `intern` role
- `adminRoles: [Role.admin]` — only `admin` can call admin API endpoints
- Role keys match the Prisma enum values (lowercase)

---

## 6. Authorization Helpers

### 6.1 Server-Side Permission Check

File: `lib/auth/authorize.ts`

```typescript
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function requirePermission(permission: {
  [resource: string]: string[]
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) throw new Error("Unauthorized")

  const hasPermission = await auth.api.userHasPermission({
    body: { ...permission, userId: session.user.id },
  })
  if (!hasPermission) throw new Error("Forbidden")

  return session
}
```

Usage in API routes:

```typescript
export async function GET() {
  const session = await requirePermission({ intern: ["create"] })
  // ...
}
```

### 6.2 Proxy File (Route-Level Auth)

File: `proxy.ts` (project root)

Uses Next.js 16 `proxy.ts` convention (replaces deprecated `middleware.ts`). Handles **optimistic** auth checks — reads session cookie without DB call — to redirect unauthenticated users to login. Fine-grained permission checks happen in the server-side `requirePermission()` helper.

**Pattern** (skeletal — expanded during implementation):

```typescript
import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/interns', '/supervisors', '/admin']
const authRoutes = ['/login', '/register']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedRoutes.some(r => path.startsWith(r))
  const isAuthRoute = authRoutes.some(r => path.startsWith(r))

  // Read session from better-auth cookie (optimistic, no DB)
  // Redirect to /login if unauthenticated on protected routes
  // Redirect to /dashboard if authenticated on auth routes
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
```

---

## 7. Files to Create/Modify

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `Role` enum, change `User.role` to `Role?` |
| `lib/auth/permissions.ts` | **Create** — statement, ac, role definitions |
| `lib/auth/authorize.ts` | **Create** — `requirePermission()` helper |
| `lib/auth.ts` | Update admin plugin config with custom roles |
| `proxy.ts` | **Create** — route-level auth guard |

---

## 8. Not Covered (Future)

- Admin/HR user management UI (CRUD users, set roles)
- Role-based UI rendering (show/hide menu items)
- Audit log model and tracking
- Data isolation (Supervisor only sees own mentees, Intern only self)
