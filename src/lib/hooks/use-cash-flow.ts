'use client'

import { useMemo } from 'react'
import { useTeamStore } from '@/lib/stores/team-store'
import {
  MATERIAL_COST,
  FACILITY_BUILD_COST,
  HIRE_COST_PER_GROUP,
  TRAINING_COST,
  DESIGN_RND_COST,
  SAFETY_RND_COST,
  PROCESS_TECH_COST,
  VEHICLE_TYPES,
} from '@/lib/logic/constants'

export function useCashFlow() {
  const assets = useTeamStore((s) => s.assets)
  const decisions = useTeamStore((s) => s.currentDecisions)

  return useMemo(() => {
    if (!assets || !decisions) {
      return { currentCash: 0, plannedExpenses: 0, availableCash: 0 }
    }

    let plannedExpenses = 0

    // Material costs
    for (const vt of VEHICLE_TYPES) {
      plannedExpenses +=
        decisions.production.materialPurchase[vt] * MATERIAL_COST[vt]
    }

    // Facility expansion
    for (const vt of VEHICLE_TYPES) {
      plannedExpenses +=
        decisions.production.facilityExpansion[vt] * FACILITY_BUILD_COST
    }

    // HR costs
    plannedExpenses += decisions.hr.newHires * HIRE_COST_PER_GROUP
    plannedExpenses +=
      decisions.hr.trainingUnskilledToSkilled *
      TRAINING_COST.unskilled_to_skilled
    plannedExpenses +=
      decisions.hr.trainingSkilledToMaster * TRAINING_COST.skilled_to_master

    // R&D costs
    const hasDesign = Object.values(decisions.rnd.designInvestments).some(
      (v) => v
    )
    if (hasDesign) {
      const key = `${assets.techLevel.design}_${assets.techLevel.design + 1}`
      plannedExpenses += DESIGN_RND_COST[key] ?? 0
    }
    if (decisions.rnd.safetyInvestment) {
      const key = `${assets.techLevel.safety}_${assets.techLevel.safety + 1}`
      plannedExpenses += SAFETY_RND_COST[key] ?? 0
    }

    // Process tech upgrade
    if (decisions.production.processTechLevel > assets.techLevel.process) {
      plannedExpenses +=
        PROCESS_TECH_COST[decisions.production.processTechLevel] ?? 0
    }

    const currentCash =
      assets.cash + decisions.finance.loanRequest - decisions.finance.loanRepay
    const availableCash = currentCash - plannedExpenses

    return { currentCash, plannedExpenses, availableCash }
  }, [assets, decisions])
}
