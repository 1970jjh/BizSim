import type {
  TeamAssets,
  RoundDecisions,
  RoundResults,
  MarketConfig,
  VehicleType,
  EmployeeTier,
  ProcessTechLevel,
  DesignTechLevel,
  SafetyLevel,
} from '@/lib/types/game'
import {
  MATERIAL_COST,
  SAFETY_FAILURE_RATE,
  FACILITY_BUILD_COST,
  FACILITY_MAINTENANCE_RATE,
  FACILITY_DEPRECIATION_RATE,
  HIRE_COST_PER_GROUP,
  MAINTENANCE_COST,
  TRAINING_COST,
  PRODUCTION_PER_LINE,
  TAX_RATE,
  SALES_ADMIN_RATE,
  GENERAL_ADMIN_RATE,
  DESIGN_RND_COST,
  SAFETY_RND_COST,
  PROCESS_TECH_COST,
  VEHICLE_TYPES,
} from './constants'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calculateRoundResults(
  assets: TeamAssets,
  decisions: RoundDecisions,
  allocatedDemand: Readonly<Record<VehicleType, number>>,
  roundConfig: MarketConfig
): RoundResults {
  // 1. FACILITIES (existing + new)
  const totalFacilities: Record<string, number> = {}
  for (const vt of VEHICLE_TYPES) {
    totalFacilities[vt] =
      assets.facilities[vt] + decisions.production.facilityExpansion[vt]
  }

  // 2. PRODUCTION = MIN(facility capacity, materials purchased)
  const production: Record<string, number> = {}
  for (const vt of VEHICLE_TYPES) {
    production[vt] = Math.min(
      totalFacilities[vt] * PRODUCTION_PER_LINE,
      decisions.production.materialPurchase[vt]
    )
  }

  // 3. SALES & REVENUE
  const salesVolume: Record<string, number> = {}
  const revenueByVehicle: Record<string, number> = {}
  let totalRevenue = 0
  for (const vt of VEHICLE_TYPES) {
    salesVolume[vt] = Math.min(production[vt], allocatedDemand[vt])
    revenueByVehicle[vt] = salesVolume[vt] * decisions.marketing.bidPrices[vt]
    totalRevenue += revenueByVehicle[vt]
  }

  // 4. VARIABLE COSTS
  let materialCost = 0
  for (const vt of VEHICLE_TYPES) {
    let unitCost = MATERIAL_COST[vt]
    if (vt === 'diesel') {
      unitCost = unitCost * roundConfig.dieselDemandMultiplier
    }
    materialCost += decisions.production.materialPurchase[vt] * unitCost
  }

  const salesAdminCost = totalRevenue * SALES_ADMIN_RATE
  const failureRate = SAFETY_FAILURE_RATE[assets.techLevel.safety]
  const failureCost = totalRevenue * failureRate
  const variableCost = materialCost + salesAdminCost + failureCost

  // 5. FIXED COSTS
  let laborCost = 0
  if (decisions.production.processTechLevel < 4) {
    const tiers: EmployeeTier[] = ['unskilled', 'skilled', 'master']
    for (const tier of tiers) {
      laborCost += assets.employees[tier] * MAINTENANCE_COST[tier]
    }
    laborCost += decisions.hr.newHires * HIRE_COST_PER_GROUP
    laborCost +=
      decisions.hr.trainingUnskilledToSkilled *
      TRAINING_COST.unskilled_to_skilled
    laborCost +=
      decisions.hr.trainingSkilledToMaster * TRAINING_COST.skilled_to_master
  }

  const totalLineCount = Object.values(totalFacilities).reduce(
    (sum, n) => sum + n,
    0
  )
  const maintenanceCost = totalLineCount * FACILITY_MAINTENANCE_RATE
  const depreciationCost = totalLineCount * FACILITY_DEPRECIATION_RATE

  const currentLoan =
    assets.loan + decisions.finance.loanRequest - decisions.finance.loanRepay
  const interestCost = Math.max(0, currentLoan) * roundConfig.interestRate

  const generalAdminCost = totalRevenue * GENERAL_ADMIN_RATE
  const fixedCost =
    laborCost +
    maintenanceCost +
    depreciationCost +
    interestCost +
    generalAdminCost

  // 6. PROFIT
  const operatingProfit = totalRevenue - (variableCost + fixedCost)
  const nonOperatingIncome = 0
  const taxAmount = operatingProfit > 0 ? operatingProfit * TAX_RATE : 0
  const netProfit = operatingProfit + nonOperatingIncome - taxAmount

  // 7. CAPITAL EXPENDITURES
  let facilityInvestment = 0
  for (const vt of VEHICLE_TYPES) {
    facilityInvestment +=
      decisions.production.facilityExpansion[vt] * FACILITY_BUILD_COST
  }

  let rndInvestment = 0
  const hasDesignInvestment = Object.values(
    decisions.rnd.designInvestments
  ).some((v) => v)
  if (hasDesignInvestment) {
    const key = `${assets.techLevel.design}_${assets.techLevel.design + 1}`
    rndInvestment += DESIGN_RND_COST[key] ?? 0
  }
  if (decisions.rnd.safetyInvestment) {
    const key = `${assets.techLevel.safety}_${assets.techLevel.safety + 1}`
    rndInvestment += SAFETY_RND_COST[key] ?? 0
  }

  const processTechCost =
    decisions.production.processTechLevel > assets.techLevel.process
      ? (PROCESS_TECH_COST[decisions.production.processTechLevel] ?? 0)
      : 0

  // 8. UPDATED ASSETS
  const totalCapex =
    materialCost +
    facilityInvestment +
    rndInvestment +
    processTechCost +
    laborCost
  const newCash =
    assets.cash +
    decisions.finance.loanRequest -
    decisions.finance.loanRepay -
    totalCapex +
    totalRevenue -
    salesAdminCost -
    failureCost -
    maintenanceCost -
    depreciationCost -
    interestCost -
    generalAdminCost -
    taxAmount

  const newLoan = Math.max(
    0,
    assets.loan + decisions.finance.loanRequest - decisions.finance.loanRepay
  )
  const newCapital = assets.capital + netProfit

  const newFacilities = { ...totalFacilities } as Record<VehicleType, number>

  const newUnskilled = Math.max(
    0,
    assets.employees.unskilled +
      decisions.hr.newHires -
      decisions.hr.trainingUnskilledToSkilled
  )
  const newSkilled = Math.max(
    0,
    assets.employees.skilled +
      decisions.hr.trainingUnskilledToSkilled -
      decisions.hr.trainingSkilledToMaster
  )
  const newMaster =
    assets.employees.master + decisions.hr.trainingSkilledToMaster

  let newDesignLevel = assets.techLevel.design
  if (hasDesignInvestment && newDesignLevel < 5) {
    newDesignLevel = (newDesignLevel + 1) as DesignTechLevel
  }

  let newSafetyLevel = assets.techLevel.safety
  if (decisions.rnd.safetyInvestment && newSafetyLevel < 5) {
    newSafetyLevel = (newSafetyLevel + 1) as SafetyLevel
  }

  const updatedAssets: TeamAssets = {
    cash: round2(newCash),
    loan: round2(newLoan),
    capital: round2(newCapital),
    facilities: newFacilities,
    techLevel: {
      process: decisions.production.processTechLevel as ProcessTechLevel,
      design: newDesignLevel,
      safety: newSafetyLevel,
    },
    employees: {
      unskilled: newUnskilled,
      skilled: newSkilled,
      master: newMaster,
    },
  }

  return {
    revenue: round2(totalRevenue),
    revenueByVehicle: revenueByVehicle as Readonly<Record<VehicleType, number>>,
    salesVolume: salesVolume as Readonly<Record<VehicleType, number>>,
    variableCost: round2(variableCost),
    materialCost: round2(materialCost),
    salesAdminCost: round2(salesAdminCost),
    failureCost: round2(failureCost),
    fixedCost: round2(fixedCost),
    laborCost: round2(laborCost),
    maintenanceCost: round2(maintenanceCost),
    depreciationCost: round2(depreciationCost),
    interestCost: round2(interestCost),
    generalAdminCost: round2(generalAdminCost),
    operatingProfit: round2(operatingProfit),
    nonOperatingIncome: 0,
    taxAmount: round2(taxAmount),
    netProfit: round2(netProfit),
    updatedAssets,
  }
}
