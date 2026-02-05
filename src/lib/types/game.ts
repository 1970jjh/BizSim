export type Role = 'ceo' | 'cfo' | 'cpo' | 'cro' | 'cmo' | 'cho'

export type VehicleType = 'gasoline' | 'diesel' | 'hybrid' | 'ev' | 'hydrogen'

export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED' | 'DELETED'

export type RoundNumber = 1 | 2 | 3 | 4

export type EconomicCycle = 'recovery' | 'boom' | 'recession' | 'green_growth'

export type EmployeeTier = 'unskilled' | 'skilled' | 'master'

export type ProcessTechLevel = 1 | 2 | 3 | 4

export type DesignTechLevel = 1 | 2 | 3 | 4 | 5

export type SafetyLevel = 1 | 2 | 3 | 4 | 5

export interface MarketConfig {
  readonly round: RoundNumber
  readonly cycle: EconomicCycle
  readonly interestRate: number
  readonly demandMultiplier: number
  readonly dieselDemandMultiplier: number
  readonly unlockedVehicles: readonly VehicleType[]
  readonly unlockedTech: readonly ProcessTechLevel[]
  readonly newsHeadline: string
  readonly newsDetails: string
}

export interface TeamAssets {
  readonly cash: number
  readonly loan: number
  readonly capital: number
  readonly facilities: Readonly<Record<VehicleType, number>>
  readonly techLevel: {
    readonly process: ProcessTechLevel
    readonly design: DesignTechLevel
    readonly safety: SafetyLevel
  }
  readonly employees: Readonly<Record<EmployeeTier, number>>
}

export interface RoundDecisions {
  readonly isSubmitted: boolean
  readonly approvals: Readonly<Record<Exclude<Role, 'ceo'>, boolean>>
  readonly finance: {
    readonly loanRequest: number
    readonly loanRepay: number
  }
  readonly production: {
    readonly materialPurchase: Readonly<Record<VehicleType, number>>
    readonly facilityExpansion: Readonly<Record<VehicleType, number>>
    readonly processTechLevel: ProcessTechLevel
  }
  readonly rnd: {
    readonly designInvestments: Readonly<Record<VehicleType, boolean>>
    readonly safetyInvestment: boolean
  }
  readonly marketing: {
    readonly bidPrices: Readonly<Record<VehicleType, number>>
  }
  readonly hr: {
    readonly newHires: number
    readonly trainingUnskilledToSkilled: number
    readonly trainingSkilledToMaster: number
  }
  readonly ceoStrategy: string
}

export interface RoundResults {
  readonly revenue: number
  readonly revenueByVehicle: Readonly<Record<VehicleType, number>>
  readonly salesVolume: Readonly<Record<VehicleType, number>>
  readonly variableCost: number
  readonly materialCost: number
  readonly salesAdminCost: number
  readonly failureCost: number
  readonly fixedCost: number
  readonly laborCost: number
  readonly maintenanceCost: number
  readonly depreciationCost: number
  readonly interestCost: number
  readonly generalAdminCost: number
  readonly operatingProfit: number
  readonly nonOperatingIncome: number
  readonly taxAmount: number
  readonly netProfit: number
  readonly updatedAssets: TeamAssets
}

export interface LeaderboardEntry {
  readonly teamId: string
  readonly teamName: string
  readonly cumulativeNetProfit: number
  readonly totalAssetValue: number
  readonly score: number
  readonly rank: number
}

export interface RoomDocument {
  readonly roomName: string
  readonly status: RoomStatus
  readonly currentRound: RoundNumber
  readonly totalTeams: number
  readonly marketDemand: number
  readonly marketConfig: MarketConfig
  readonly createdAt: number
  readonly leaderboard?: readonly LeaderboardEntry[]
}

export interface TeamDocument {
  readonly teamName: string
  readonly assets: TeamAssets
  readonly roles: Partial<Record<Role, { uid: string; nickname: string }>>
  readonly cumulativeNetProfit: number
}

export interface ApiResponse<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}
