import type { InternStatus } from "@/generated/prisma/enums";

export type SupervisedAssessmentStatus =
  | "draft"
  | "submitted"
  | "finalized"
  | null;

export interface SupervisedIntern {
  internProfileId: string;
  name: string;
  image: string | null;
  nik: string;
  institution: string;
  team: string | null;
  periodStart: Date;
  periodEnd: Date;
  internStatus: InternStatus;
  assignmentEndedAt: Date | null;
  approvedLogbooks: number;
  totalLogbooks: number;
  pendingLogbooks: number;
  assessmentStatus: SupervisedAssessmentStatus;
}

export interface SupervisedInternList {
  active: SupervisedIntern[];
  history: SupervisedIntern[];
}
