import type {
  MarketConfig,
  RoundNumber,
  SafetyLevel,
  VehicleType,
  TeamAssets,
  RoundDecisions,
  Role,
  ProcessTechLevel,
} from '@/lib/types/game'

export const INITIAL_ASSETS: TeamAssets = {
  cash: 6820,
  loan: 2820,
  capital: 4000,
  facilities: { gasoline: 2, diesel: 2, hybrid: 0, ev: 0, hydrogen: 0 },
  techLevel: { process: 1 as ProcessTechLevel, design: 1, safety: 1 },
  employees: { unskilled: 4, skilled: 0, master: 0 },
}

export const MATERIAL_COST: Readonly<Record<VehicleType, number>> = {
  gasoline: 900,
  diesel: 1200,
  hybrid: 1500,
  ev: 2000,
  hydrogen: 2500,
}

export const DESIGN_RND_COST: Readonly<Record<string, number>> = {
  '1_2': 400,
  '2_3': 600,
  '3_4': 800,
  '4_5': 1000,
}

export const SAFETY_FAILURE_RATE: Readonly<Record<SafetyLevel, number>> = {
  1: 0.20,
  2: 0.15,
  3: 0.10,
  4: 0.03,
  5: 0.00,
}

export const SAFETY_RND_COST: Readonly<Record<string, number>> = {
  '1_2': 200,
  '2_3': 300,
  '3_4': 400,
  '4_5': 500,
}

export const HIRE_COST_PER_GROUP = 60
export const MAINTENANCE_COST = { unskilled: 50, skilled: 60, master: 80 } as const
export const TRAINING_COST = { unskilled_to_skilled: 20, skilled_to_master: 30 } as const

export const FACILITY_BUILD_COST = 500
export const FACILITY_MAINTENANCE_RATE = 50
export const FACILITY_DEPRECIATION_RATE = 50

export const PROCESS_TECH_COST: Readonly<Record<number, number>> = {
  2: 300,
  3: 500,
  4: 700,
}

export const PRODUCTION_PER_LINE = 1
export const BASE_DEMAND_PER_TEAM = 2

export const MARKET_SHARE_BONUS = 1.2
export const MARKET_SHARE_PENALTY = 0.8

export const TAX_RATE = 0.10
export const SALES_ADMIN_RATE = 0.05
export const GENERAL_ADMIN_RATE = 0.10

export const VEHICLE_TYPES: readonly VehicleType[] = [
  'gasoline', 'diesel', 'hybrid', 'ev', 'hydrogen',
]

export const ROUND_CONFIGS: Readonly<Record<RoundNumber, MarketConfig>> = {
  1: {
    round: 1,
    cycle: 'recovery',
    interestRate: 0.07,
    demandMultiplier: 1.0,
    dieselDemandMultiplier: 1.0,
    unlockedVehicles: ['gasoline', 'diesel'],
    unlockedTech: [1, 2],
    newsHeadline: '1기: 경기 회복기 - 균형 잡힌 시장',
    newsDetails: '이자율 7%. 가솔린/디젤 수요 균형. 안정적 성장 기회를 잡으세요.',
  },
  2: {
    round: 2,
    cycle: 'boom',
    interestRate: 0.05,
    demandMultiplier: 1.75,
    dieselDemandMultiplier: 2.0,
    unlockedVehicles: ['gasoline', 'diesel'],
    unlockedTech: [1, 2, 3],
    newsHeadline: '2기: 호황기 - 수요 폭발!',
    newsDetails: '이자율 5%. 전체 수요 +75% 증가! 디젤 수요 +100% 폭등. 설비 대폭 증설이 필요합니다.',
  },
  3: {
    round: 3,
    cycle: 'recession',
    interestRate: 0.15,
    demandMultiplier: 0.67,
    dieselDemandMultiplier: 0.25,
    unlockedVehicles: ['gasoline', 'diesel', 'hybrid'],
    unlockedTech: [1, 2, 3],
    newsHeadline: '3기: 불황기 - 위기 관리',
    newsDetails: '이자율 15%! 전체 수요 -33% 감소. 디젤 수요 -75% 폭락. 하이브리드 차량 시장이 개방됩니다.',
  },
  4: {
    round: 4,
    cycle: 'green_growth',
    interestRate: 0.07,
    demandMultiplier: 1.55,
    dieselDemandMultiplier: 1.0,
    unlockedVehicles: ['gasoline', 'diesel', 'hybrid', 'ev'],
    unlockedTech: [1, 2, 3, 4],
    newsHeadline: '4기: 친환경 성장기 - 미래를 향해',
    newsDetails: '이자율 7%. 수요 +55% 증가. 전기차 및 AI 자동화 설비(Lv4)가 개방됩니다.',
  },
}

const ZERO_VEHICLES: Readonly<Record<VehicleType, number>> = {
  gasoline: 0, diesel: 0, hybrid: 0, ev: 0, hydrogen: 0,
}

const FALSE_VEHICLES: Readonly<Record<VehicleType, boolean>> = {
  gasoline: false, diesel: false, hybrid: false, ev: false, hydrogen: false,
}

const FALSE_ROLES: Readonly<Record<Exclude<Role, 'ceo'>, boolean>> = {
  cfo: false, cpo: false, cro: false, cmo: false, cho: false,
}

export const DEFAULT_ROUND_DECISIONS: RoundDecisions = {
  isSubmitted: false,
  approvals: FALSE_ROLES,
  finance: { loanRequest: 0, loanRepay: 0 },
  production: {
    materialPurchase: ZERO_VEHICLES,
    facilityExpansion: ZERO_VEHICLES,
    processTechLevel: 1 as ProcessTechLevel,
  },
  rnd: { designInvestments: FALSE_VEHICLES, safetyInvestment: false },
  marketing: { bidPrices: ZERO_VEHICLES },
  hr: { newHires: 0, trainingUnskilledToSkilled: 0, trainingSkilledToMaster: 0 },
  ceoStrategy: '',
}

export const VEHICLE_LABELS: Readonly<Record<VehicleType, string>> = {
  gasoline: '가솔린',
  diesel: '디젤',
  hybrid: '하이브리드',
  ev: '전기차',
  hydrogen: '수소차',
}

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  ceo: 'CEO (최고경영자)',
  cfo: 'CFO (최고재무책임자)',
  cpo: 'CPO (최고생산책임자)',
  cro: 'CRO (최고연구책임자)',
  cmo: 'CMO (최고마케팅책임자)',
  cho: 'CHO (최고인사책임자)',
}

export const ROLE_ICONS: Readonly<Record<Role, string>> = {
  ceo: '\uD83D\uDC51',
  cfo: '\uD83D\uDCB0',
  cpo: '\uD83C\uDFED',
  cro: '\uD83D\uDD2C',
  cmo: '\uD83D\uDCE3',
  cho: '\uD83E\uDD1D',
}
