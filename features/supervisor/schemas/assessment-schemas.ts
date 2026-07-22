import z from "zod"

export const getAssessmentListSchema = z.object({
  supervisorProfileId: z.string(),
  page: z.number().int().positive().default(1),
  search: z.string().optional(),
  status: z.string().optional(),
})

export type GetAssessmentListInput = z.infer<typeof getAssessmentListSchema>
