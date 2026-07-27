import type { InternStatus } from "@/generated/prisma/enums";

export type DeptDistribution = {
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
  department: string | null;
};

export type DashboardData = {
  totalActiveInterns: number;
  totalActiveSupervisors: number;
  totalInternsPrevMonth: number;
  logbookFillRate: number;
  logbookFillRatePrevMonth: number;
  attendanceRate: number;
  attendanceRatePrevMonth: number;
  deptDistribution: DeptDistribution[];
  internStatusCounts: InternStatusCount[];
  weeklyFillRates: WeeklyFillRate[];
  warningInterns: InternWarning[];
};
