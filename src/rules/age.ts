import { rollDie, rollDice, type Rng, defaultRng } from './dice'
import type { Characteristics } from './types'

export const MIN_AGE = 15
export const MAX_AGE = 89

export interface AgeBracket {
  min: number
  max: number
  /** Points the player distributes as deductions among STR/CON/DEX (older) or STR/SIZ (teens). */
  physicalDeduction: number
  /** Which characteristics the deduction may come from. */
  deductFrom: readonly ('STR' | 'CON' | 'DEX' | 'SIZ')[]
  appDeduction: number
  eduDeduction: number
  eduImprovementChecks: number
  movePenalty: number
  /** Teens roll Luck twice and keep the better result. */
  luckTwice: boolean
}

export const AGE_BRACKETS: readonly AgeBracket[] = [
  { min: 15, max: 19, physicalDeduction: 5, deductFrom: ['STR', 'SIZ'], appDeduction: 0, eduDeduction: 5, eduImprovementChecks: 0, movePenalty: 0, luckTwice: true },
  { min: 20, max: 39, physicalDeduction: 0, deductFrom: [], appDeduction: 0, eduDeduction: 0, eduImprovementChecks: 1, movePenalty: 0, luckTwice: false },
  { min: 40, max: 49, physicalDeduction: 5, deductFrom: ['STR', 'CON', 'DEX'], appDeduction: 5, eduDeduction: 0, eduImprovementChecks: 2, movePenalty: 1, luckTwice: false },
  { min: 50, max: 59, physicalDeduction: 10, deductFrom: ['STR', 'CON', 'DEX'], appDeduction: 10, eduDeduction: 0, eduImprovementChecks: 3, movePenalty: 2, luckTwice: false },
  { min: 60, max: 69, physicalDeduction: 20, deductFrom: ['STR', 'CON', 'DEX'], appDeduction: 15, eduDeduction: 0, eduImprovementChecks: 4, movePenalty: 3, luckTwice: false },
  { min: 70, max: 79, physicalDeduction: 40, deductFrom: ['STR', 'CON', 'DEX'], appDeduction: 20, eduDeduction: 0, eduImprovementChecks: 4, movePenalty: 4, luckTwice: false },
  { min: 80, max: 89, physicalDeduction: 80, deductFrom: ['STR', 'CON', 'DEX'], appDeduction: 25, eduDeduction: 0, eduImprovementChecks: 4, movePenalty: 5, luckTwice: false },
]

export function ageBracket(age: number): AgeBracket {
  const bracket = AGE_BRACKETS.find((b) => age >= b.min && age <= b.max)
  if (!bracket) throw new Error(`Age ${age} is outside the allowed range ${MIN_AGE}-${MAX_AGE}`)
  return bracket
}

export interface EduCheckResult {
  roll: number
  improved: boolean
  gain: number
  eduAfter: number
}

/**
 * One EDU improvement check: roll 1D100; if the result is greater than
 * current EDU, add 1D10 to EDU (to a maximum of 99).
 */
export function eduImprovementCheck(edu: number, rng: Rng = defaultRng): EduCheckResult {
  const roll = rollDice(1, 100, rng)
  if (roll > edu) {
    const gain = rollDie(10, rng)
    return { roll, improved: true, gain, eduAfter: Math.min(99, edu + gain) }
  }
  return { roll, improved: false, gain: 0, eduAfter: edu }
}

export function runEduImprovementChecks(
  edu: number,
  count: number,
  rng: Rng = defaultRng,
): { results: EduCheckResult[]; eduAfter: number } {
  const results: EduCheckResult[] = []
  let current = edu
  for (let i = 0; i < count; i++) {
    const result = eduImprovementCheck(current, rng)
    results.push(result)
    current = result.eduAfter
  }
  return { results, eduAfter: current }
}

/** How the player chose to distribute the physical deduction of their bracket. */
export type DeductionSplit = Partial<Record<'STR' | 'CON' | 'DEX' | 'SIZ', number>>

export function validateDeductionSplit(age: number, split: DeductionSplit): string[] {
  const bracket = ageBracket(age)
  const errors: string[] = []
  let total = 0
  for (const [name, value] of Object.entries(split)) {
    if (value === undefined || value === 0) continue
    if (!bracket.deductFrom.includes(name as 'STR')) {
      errors.push(`Cannot deduct from ${name} at age ${age}`)
    }
    if (value < 0) errors.push(`Deduction from ${name} cannot be negative`)
    total += value
  }
  if (total !== bracket.physicalDeduction) {
    errors.push(
      `Distribute exactly ${bracket.physicalDeduction} points of deductions (currently ${total})`,
    )
  }
  return errors
}

/**
 * Apply all age modifiers to a set of rolled characteristics.
 * `eduAfterChecks` is the EDU value after improvement checks (rolled separately
 * so the UI can show each check); the deduction split is the player's choice.
 */
export function applyAgeModifiers(
  chars: Characteristics,
  age: number,
  split: DeductionSplit,
  eduAfterChecks: number,
): Characteristics {
  const bracket = ageBracket(age)
  const result: Characteristics = { ...chars, EDU: eduAfterChecks }
  for (const [name, value] of Object.entries(split)) {
    if (value) result[name as keyof Characteristics] = Math.max(1, result[name as keyof Characteristics] - value)
  }
  result.APP = Math.max(1, result.APP - bracket.appDeduction)
  result.EDU = Math.max(1, result.EDU - bracket.eduDeduction)
  return result
}
