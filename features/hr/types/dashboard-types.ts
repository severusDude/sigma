import type { InternStatus } from "@/generated/prisma/enums";

export type TeamDistribution = {
  name: string;
  count: number;
};

export type InternStatusCount = {
  status: InternStatus;
  count: number;
};

export type WeeklyFillRate = {
  week: string;
  rate: number;
};

export type InternWarning = {
  internId: string;
  name: string;
  institution: string;
  logbookRate: number;
  team: string | null;
};

export type DashboardData = {
  totalActiveInterns: number;
  totalActiveSupervisors: number;
  totalInternsPrevMonth: number;
  logbookFillRate: number;
  logbookFillRatePrevMonth: number;
  attendanceRate: number;
  attendanceRatePrevMonth: number;
  teamDistribution: TeamDistribution[];
  internStatusCounts: InternStatusCount[];
  weeklyFillRates: WeeklyFillRate[];
  warningInterns: InternWarning[];
};
