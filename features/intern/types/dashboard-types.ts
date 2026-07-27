export type InternDashboardData = {
  name: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  activeDay: number;
  totalDays: number;
  logbookFilled: number;
  logbookTotal: number;
  logbookTrend: number;
  attendancePresent: number;
  attendanceTotal: number;
  attendanceTrend: number;
  avgScore: number | null;
  avgGrade: string | null;
  supervisorName: string | null;
  supervisorNip: string | null;
  departmentName: string | null;
  weeklyLogbooks: {
    week: string;
    approved: number;
    pending: number;
    revision: number;
  }[];
  recentActivity: {
    date: string;
    activity: string;
    status: string;
  }[];
};
