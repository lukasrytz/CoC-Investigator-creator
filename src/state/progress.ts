import type { Characteristics, Investigator } from '../rules/types'
import { validatePointBuy, validateManual } from '../rules/characteristics'
import { ageBracket, validateDeductionSplit, type DeductionSplit } from '../rules/age'
import { validateAllocation } from '../rules/allocation'
import type { GenMethod } from './store'

export type StepStatus = 'complete' | 'attention' | 'incomplete'

export interface ProgressInput {
  genMethod: GenMethod
  baseCharacteristics: Characteristics
  deductionSplit: DeductionSplit
  investigator: Investigator
}

/** Blocking problems on the Characteristics step (also shown inside the step). */
export function characteristicErrors(s: ProgressInput): string[] {
  const errors: string[] = []
  if (s.genMethod === 'pointbuy') errors.push(...validatePointBuy(s.baseCharacteristics).errors)
  if (s.genMethod === 'manual') errors.push(...validateManual(s.baseCharacteristics))
  const bracket = ageBracket(s.investigator.age)
  if (bracket.physicalDeduction > 0) {
    errors.push(...validateDeductionSplit(s.investigator.age, s.deductionSplit))
  }
  if (s.investigator.luck === 0) errors.push('Roll or enter Luck')
  return errors
}

export function hasCharacteristicValues(chars: Characteristics): boolean {
  return Object.values(chars).some((v) => v > 0)
}

const isPersonalError = (e: string) => e.startsWith('Personal interest')

/** Status of each of the eight wizard steps, in order. */
export function stepStatuses(s: ProgressInput): StepStatus[] {
  const inv = s.investigator
  const hasValues = hasCharacteristicValues(s.baseCharacteristics)
  const charErrors = hasValues ? characteristicErrors(s) : []
  const alloc = validateAllocation(inv)
  const occErrors = alloc.errors.filter((e) => !isPersonalError(e))
  const personalErrors = alloc.errors.filter(isPersonalError)

  const basics: StepStatus = inv.name.trim() ? 'complete' : 'incomplete'

  const characteristics: StepStatus = !hasValues
    ? 'incomplete'
    : charErrors.length > 0
      ? 'attention'
      : 'complete'

  const occupation: StepStatus = inv.occupationId ? 'complete' : 'incomplete'

  let occupationSkills: StepStatus = 'incomplete'
  if (inv.occupationId && hasValues) {
    if (occErrors.length > 0) occupationSkills = 'attention'
    else if (alloc.occupationRemaining === 0) occupationSkills = 'complete'
  }

  let personal: StepStatus = 'incomplete'
  if (hasValues) {
    if (personalErrors.length > 0) personal = 'attention'
    else if (alloc.personalRemaining === 0) personal = 'complete'
  }

  const b = inv.backstory
  const backstoryDone =
    [b.ideology, b.significantPeople, b.meaningfulLocations, b.treasuredPossessions, b.traits].every(
      (t) => t.trim() !== '',
    ) && b.keyConnection !== ''
  const backstory: StepStatus = backstoryDone ? 'complete' : 'incomplete'

  const gear: StepStatus = inv.gear.length > 0 || inv.notes.trim() !== '' ? 'complete' : 'incomplete'

  const earlier = [basics, characteristics, occupation, occupationSkills, personal, backstory, gear]
  const review: StepStatus = earlier.some((st) => st === 'attention')
    ? 'attention'
    : earlier.every((st) => st === 'complete')
      ? 'complete'
      : 'incomplete'

  return [...earlier, review]
}
