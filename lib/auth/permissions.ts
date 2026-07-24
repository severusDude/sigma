import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  user: ["create", "list", "set-role", "impersonate", "delete", "set-password"],
  system: ["manage"],
  audit_log: ["read"],
  intern: ["create", "read", "update", "delete"],
  supervisor: ["create", "read", "update", "delete"],
  assignment: ["create", "read", "update", "delete"],
  dashboard: ["view-full", "view-operational", "view-limited"],
  document: ["create", "read", "delete"],
  report: ["create", "read"],
  logbook: ["review", "approve", "read"],
  assessment: ["create", "read", "update", "finalize"],
  journal: ["create", "read", "update", "delete"],
  attendance: ["create", "read"],
  info: ["read"],
  download: ["read"],
} as const;

export const ac = createAccessControl(statement);

export const intern = ac.newRole({
  journal: ["create", "read", "update", "delete"],
  attendance: ["create", "read"],
  info: ["read"],
  download: ["read"],
});

export const supervisor = ac.newRole({
  ...intern.statements,
  logbook: ["review", "approve", "read"],
  assessment: ["create", "read", "update"],
  dashboard: ["view-limited"],
});

export const hr = ac.newRole({
  ...supervisor.statements,
  user: ["delete", "set-password"],
  assessment: ["create", "read", "update", "finalize"],
  intern: ["create", "read", "update", "delete"],
  supervisor: ["create", "read", "update", "delete"],
  assignment: ["create", "read", "update", "delete"],
  document: ["create", "read", "delete"],
  report: ["create", "read"],
  dashboard: ["view-operational"],
});

export const admin = ac.newRole({
  ...hr.statements,
  user: ["create", "list", "set-role", "impersonate", "delete"],
  system: ["manage"],
  audit_log: ["read"],
  dashboard: ["view-full"],
});
