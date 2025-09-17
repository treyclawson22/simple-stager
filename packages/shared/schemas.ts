import { z } from 'zod'

export const workflowCreateSchema = z.object({
  goal: z.enum(['stage', 'declutter', 'improve']),
  roomType: z.string().optional(),
  style: z.string().optional(),
  colorNotes: z.string().optional(),
  budgetVibe: z.string().optional(),
})

export const promptAnswersSchema = z.object({
  roomType: z.string().optional(),
  style: z.string().optional(),
  palette: z.string().optional(),
  buyerProfile: z.string().optional(),
  notes: z.string().optional(),
  projectName: z.string().optional(),
})

export const imageUploadSchema = z.object({
  file: z.any(),
  workflowId: z.string().cuid(),
})

export const generateImageSchema = z.object({
  workflowId: z.string().cuid(),
  prompt: z.string().min(10),
})

export const downloadResultSchema = z.object({
  resultId: z.string().cuid(),
})

export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>
export type PromptAnswersInput = z.infer<typeof promptAnswersSchema>
export type ImageUploadInput = z.infer<typeof imageUploadSchema>
export type GenerateImageInput = z.infer<typeof generateImageSchema>
export type DownloadResultInput = z.infer<typeof downloadResultSchema>