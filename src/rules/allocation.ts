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

/** Live fulfillment of one occupation skill slot, for the checklist UI. */
export interface SlotStatus {
  kind: 'fixed' | 'choice' | 'any'
  label: string
  count: number
  used: number
  /** Names of the skills that filled this slot. */
  filledBy: string[]
}

/**
 * Match the skills that received occupation points against the occupation's
 * slots: fixed skills match directly, choice slots have a capacity of `count`
 * from their group, and 'any' slots (merged into one "free picks" entry)
 * absorb the rest. Returns per-slot fulfillment plus the names of allocations
 * that fit no slot.
 */
export function occupationSlotStatus(
  occupation: Occupation,
  allocations: readonly SkillAllocation[],
  customSkills: readonly CustomSkill[] = [],
): { slots: SlotStatus[]; unmatched: string[] } {
  const skillName = (skillId: string, spec?: string) => {
    const def = resolveSkill(customSkills, skillId)
    return spec ? `${def.name} (${spec})` : def.name
  }

  const fixedIds = new Set<string>()
  const fixedSlots: { skillId: string; spec?: string; status: SlotStatus }[] = []
  const choiceSlots: { from: readonly string[]; status: SlotStatus }[] = []
  let anyCapacity = 0
  for (const slot of occupation.slots) {
    if (slot.kind === 'fixed') {
      fixedIds.add(slot.skillId)
      fixedSlots.push({
        skillId: slot.skillId,
        spec: slot.spec,
        status: { kind: 'fixed', label: skillName(slot.skillId, slot.spec), count: 1, used: 0, filledBy: [] },
      })
    } else if (slot.kind === 'choice') {
      choiceSlots.push({
        from: slot.from,
        status: { kind: 'choice', label: slot.label, count: slot.count, used: 0, filledBy: [] },
      })
    } else {
      anyCapacity += slot.count
    }
  }
  const anyStatus: SlotStatus | null =
    anyCapacity > 0 ? { kind: 'any', label: 'Free picks', count: anyCapacity, used: 0, filledBy: [] } : null

  const unmatched: string[] = []
  for (const alloc of allocations) {
    if (alloc.occupationPoints <= 0 || alloc.skillId === 'credit-rating') continue
    if (fixedIds.has(alloc.skillId)) {
      // Fixed skills never spill into choice/any capacity; tick the precise
      // slot (matching spec, if the slot demands one) when there is one.
      const slot = fixedSlots.find(
        (f) => f.skillId === alloc.skillId && f.status.used === 0 && (!f.spec || f.spec === alloc.spec),
      )
      if (slot) {
        slot.status.used = 1
        slot.status.filledBy.push(skillName(alloc.skillId, alloc.spec))
      }
      continue
    }
    const choice = choiceSlots.find((s) => s.status.used < s.status.count && s.from.includes(alloc.skillId))
    if (choice) {
      choice.status.used++
      choice.status.filledBy.push(skillName(alloc.skillId, alloc.spec))
      continue
    }
    if (anyStatus && anyStatus.used < anyStatus.count) {
      anyStatus.used++
      anyStatus.filledBy.push(skillName(alloc.skillId, alloc.spec))
      continue
    }
    unmatched.push(resolveSkill(customSkills, alloc.skillId).name)
  }

  const slots = [
    ...fixedSlots.map((f) => f.status),
    ...choiceSlots.map((c) => c.status),
    ...(anyStatus ? [anyStatus] : []),
  ]
  return { slots, unmatched }
}

function matchSlots(
  occupation: Occupation,
  allocations: SkillAllocation[],
  customSkills: readonly CustomSkill[],
): string[] {
  return occupationSlotStatus(occupation, allocations, customSkills).unmatched.map(
    (name) => `${name} is not one of the occupation's skills (and all free picks are used)`,
  )
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
