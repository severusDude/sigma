export type InternDashboard = {
  internProfileId: string;
  name: string;
  image: string | null;
  institution: string;
  team: string | null;
  approvedLogbooks: number;
  totalLogbooks: number;
  presentDays: number;
  totalAttendance: number;
  assessmentStatus: string | null;
};

export type SupervisorDashboardData = {
  totalInterns: number;
  pendingReviewCount: number;
  pendingReviewYesterday: number;
  pendingAssessmentCount: number;
  avgCompliance: number;
  avgCompliancePrevMonth: number;
  internLogbookStatus: {
    name: string;
    approved: number;
    pending: number;
    revision: number;
  }[];
  assessmentProgress: { assessed: number; notAssessed: number };
  interns: InternDashboard[];
};
