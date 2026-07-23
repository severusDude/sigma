import z from "zod";

export const getAssessmentsSchema = z.object({
  status: z.string().optional(),
  supervisorId: z.string().optional(),
  search: z.string().optional(),
});

export const finalizeAssessmentSchema = z.object({
  assessmentId: z.string(),
});

export type GetAssessmentsInput = z.infer<typeof getAssessmentsSchema>;
export type FinalizeAssessmentInput = z.infer<typeof finalizeAssessmentSchema>;
