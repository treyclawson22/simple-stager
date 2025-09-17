export * from '@prisma/client'
import client from './client'
export const prisma = client

// Explicitly export the generated types
export type { User, Plan, Workflow, Result, CreditLedger, Password, Job, Integration } from '@prisma/client'