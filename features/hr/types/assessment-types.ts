const assessmentInclude = {
  internProfile: {
    include: {
      user: true,
    },
  },
  supervisor: {
    include: {
      user: true,
    },
  },
  components: true,
} as const;

export { assessmentInclude };

export interface HrAssessmentListItem {
  assessmentId: string;
  internName: string;
  internNim: string;
  institution: string;
  internProfileStatus: string;
  supervisorName: string;
  supervisorNip: string;
  status: string;
  periodStart: Date;
  periodEnd: Date;
  finalScore: number | null;
  finalGrade: string | null;
}

export interface HrAssessmentDetail {
  assessmentId: string;
  internProfileId: string;
  internName: string;
  internNim: string;
  institution: string;
  supervisorName: string;
  supervisorNip: string;
  supervisorField: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  finalScore: number | null;
  finalGrade: string | null;
  finalizedAt: Date | null;
  finalizedBy: string | null;
  components: {
    name: string;
    weight: number;
    score: number | null;
    notes: string | null;
  }[];
}
