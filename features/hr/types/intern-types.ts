import type { InternProfile, User, Department, InternSupervisor, SupervisorProfile } from "@/generated/prisma/client";

export interface InternWithRelations extends InternProfile {
  user: Pick<User, "id" | "name" | "email">;
  department: Pick<Department, "id" | "name"> | null;
  supervisorAssignments: (InternSupervisor & {
    supervisor: SupervisorProfile & { user: Pick<User, "name" | "email"> };
  })[];
}

export interface InternRow {
  id: string;
  name: string;
  nik: string;
  institution: string;
  phone: string | null;
  email: string | null;
  department: string | null;
  departmentId: string | null;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  supervisor: string | null;
  internProfile: InternWithRelations;
}
