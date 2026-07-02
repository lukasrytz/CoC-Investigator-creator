import type { Characteristics, CustomSkill, Investigator, Occupation, PointsFormula, SkillAllocation } from './types'
import { resolveSkill, skillBase } from './skills'
import { occupationById } from './occupations'

export const SKILL_CAP = 99

export function occupationPoints(formula: PointsFormula, chars: Characteristics): number {
  if (formula.kind === 'edu4') return chars.EDU * 4
  const best = Math.max(...formula.other.map((c) => chars[c]))
  return chars.EDU * 2 + best * 2
}

export function personalInterestPoints(chars: Characteristics): number {
  return chars.INT * 2
}

export function formulaLabel(formula: PointsFormula): string {
  if (formula.kind === 'edu4') return 'EDU × 4'
  return `EDU × 2 + ${formula.other.join(' or ')} × 2`
}

/** Total value of a skill: base + occupation + personal points. */
export function skillTotal(
  alloc: SkillAllocation,
  chars: Characteristics,
  customSkills?: readonly CustomSkill[],
): number {
  return skillBase(resolveSkill(customSkills, alloc.skillId), chars) + alloc.occupationPoints + alloc.personalPoints
}

export interface AllocationStatus {
  occupationPool: number
  occupationSpent: number
  occupationRemaining: number
  personalPool: number
  personalSpent: number
  personalRemaining: number
  creditRating: number
  errors: string[]
}

/**
 * Check whether the skills that received occupation points fit the
 * occupation's slots: fixed skills match directly, choice slots have a
 * capacity of `count` from their group, and 'any' slots absorb the rest.
 */
function matchSlots(
  occupation: Occupation,
  allocations: SkillAllocation[],
  customSkills: readonly CustomSkill[],
): string[] {
  const errors: string[] = []
  const fixedIds = new Set(
    occupation.slots.flatMap((s) => (s.kind === 'fixed' ? [s.skillId] : [])),
  )
  const choiceSlots = occupation.slots.flatMap((s) =>
    s.kind === 'choice' ? [{ ...s, used: 0 }] : [],
  )
  let anyCapacity = occupation.slots.reduce((n, s) => (s.kind === 'any' ? n + s.count : n), 0)

  for (const alloc of allocations) {
    if (alloc.occupationPoints <= 0 || alloc.skillId === 'credit-rating') continue
    if (fixedIds.has(alloc.skillId)) continue
    const choice = choiceSlots.find((s) => s.used < s.count && s.from.includes(alloc.skillId))
    if (choice) {
      choice.used++
      continue
    }
    if (anyCapacity > 0) {
      anyCapacity--
      continue
    }
    errors.push(
      `${resolveSkill(customSkills, alloc.skillId).name} is not one of the occupation's skills (and all free picks are used)`,
    )
  }
  return errors
}

export function validateAllocation(inv: Investigator): AllocationStatus {
  const errors: string[] = []
  const chars = inv.characteristics
  const occupation = inv.occupationId ? occupationById(inv.occupationId) : null

  const occupationPool = occupation ? occupationPoints(occupation.points, chars) : 0
  const personalPool = personalInterestPoints(chars)

  let occupationSpent = 0
  let personalSpent = 0
  let creditRating = 0

  const customSkills = inv.customSkills ?? []
  for (const alloc of inv.skills) {
    const def = resolveSkill(customSkills, alloc.skillId)
    if (alloc.occupationPoints < 0 || alloc.personalPoints < 0) {
      errors.push(`${def.name}: points cannot be negative`)
    }
    occupationSpent += alloc.occupationPoints
    personalSpent += alloc.personalPoints
    if (def.lockedAtCreation && alloc.occupationPoints + alloc.personalPoints > 0) {
      errors.push(`${def.name} cannot be increased at creation`)
    }
    const total = skillTotal(alloc, chars, customSkills)
    if (total > SKILL_CAP) {
      errors.push(`${def.name} exceeds the maximum of ${SKILL_CAP} (currently ${total})`)
    }
    if (alloc.skillId === 'credit-rating') {
      creditRating = total
    }
  }

  if (occupationSpent > occupationPool) {
    errors.push(`Occupation points overspent: ${occupationSpent} of ${occupationPool}`)
  }
  if (personalSpent > personalPool) {
    errors.push(`Personal interest points overspent: ${personalSpent} of ${personalPool}`)
  }

  if (occupation) {
    if (creditRating < occupation.creditRating.min || creditRating > occupation.creditRating.max) {
      errors.push(
        `Credit Rating must be between ${occupation.creditRating.min} and ${occupation.creditRating.max} for ${occupation.name} (currently ${creditRating})`,
      )
    }
    errors.push(...matchSlots(occupation, inv.skills, customSkills))
  }

  return {
    occupationPool,
    occupationSpent,
    occupationRemaining: occupationPool - occupationSpent,
    personalPool,
    personalSpent,
    personalRemaining: personalPool - personalSpent,
    creditRating,
    errors,
  }
}
