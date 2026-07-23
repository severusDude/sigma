import z from "zod"

export const componentScoreSchema = z.object({
  name: z.string().min(1),
  weight: z.number().positive(),
  score: z.number().int().min(0).max(100).nullable(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
})

export const createOrUpdateAssessmentSchema = z.object({
  internProfileId: z.string(),
  components: z.array(componentScoreSchema).length(5),
})

export const submitAssessmentSchema = z.object({
  assessmentId: z.string(),
})

export type CreateOrUpdateAssessmentInput = z.infer<typeof createOrUpdateAssessmentSchema>
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>
