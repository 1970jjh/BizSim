import { z } from 'zod'

const vehicleNumberSchema = z.object({
  gasoline: z.number().int().min(0),
  diesel: z.number().int().min(0),
  hybrid: z.number().int().min(0),
  ev: z.number().int().min(0),
  hydrogen: z.number().int().min(0),
})

const vehicleBooleanSchema = z.object({
  gasoline: z.boolean(),
  diesel: z.boolean(),
  hybrid: z.boolean(),
  ev: z.boolean(),
  hydrogen: z.boolean(),
})

const vehiclePriceSchema = z.object({
  gasoline: z.number().min(0),
  diesel: z.number().min(0),
  hybrid: z.number().min(0),
  ev: z.number().min(0),
  hydrogen: z.number().min(0),
})

export const financeInputSchema = z.object({
  loanRequest: z.number().min(0).max(10000),
  loanRepay: z.number().min(0),
})

export const productionInputSchema = z.object({
  materialPurchase: vehicleNumberSchema,
  facilityExpansion: vehicleNumberSchema,
  processTechLevel: z.number().int().min(1).max(4),
})

export const rndInputSchema = z.object({
  designInvestments: vehicleBooleanSchema,
  safetyInvestment: z.boolean(),
})

export const marketingInputSchema = z.object({
  bidPrices: vehiclePriceSchema,
})

export const hrInputSchema = z.object({
  newHires: z.number().int().min(0).max(20),
  trainingUnskilledToSkilled: z.number().int().min(0),
  trainingSkilledToMaster: z.number().int().min(0),
})

export const roomCreateSchema = z.object({
  roomName: z.string().min(1).max(50),
  totalTeams: z.number().int().min(2).max(12),
})

export const loginSchema = z.object({
  nickname: z.string().min(1).max(20),
  roomCode: z.string().length(4),
})
