export type WorkflowGoal = 'stage' | 'declutter' | 'improve'

export type WorkflowStatus = 'ready' | 'processing' | 'completed' | 'failed'

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type AuthProvider = 'google' | 'apple' | 'password'

export type CloudProvider = 'gdrive' | 'dropbox' | 'icloud'

export type CreditReason = 'purchase' | 'download' | 'admin_adjust' | 'referral_reward' | 'trial'

export type PlanInterval = 'monthly' | 'yearly'

export interface PromptAnswers {
  roomType?: string
  style?: string
  palette?: string
  buyerProfile?: string
  notes?: string
}

export interface WorkflowCreateData {
  goal: WorkflowGoal
  sourceImage: string
  roomType?: string
  style?: string
  colorNotes?: string
  budgetVibe?: string
}

export interface ImageGenerationJob {
  workflowId: string
  prompt: string
  sourceImage: string
  provider: string
}