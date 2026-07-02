import { roll2d6plus6x5, roll3d6x5, type Rng, defaultRng } from './dice'
import type { CharacteristicName, Characteristics } from './types'

/** SIZ, INT and EDU roll (2D6+6)×5; the rest roll 3D6×5. */
export const HIGH_ROLL_CHARACTERISTICS: readonly CharacteristicName[] = ['SIZ', 'INT', 'EDU']

export function rollCharacteristic(name: CharacteristicName, rng: Rng = defaultRng): number {
  return HIGH_ROLL_CHARACTERISTICS.includes(name) ? roll2d6plus6x5(rng) : roll3d6x5(rng)
}

export function rollAllCharacteristics(rng: Rng = defaultRng): Characteristics {
  return {
    STR: rollCharacteristic('STR', rng),
    CON: rollCharacteristic('CON', rng),
    SIZ: rollCharacteristic('SIZ', rng),
    DEX: rollCharacteristic('DEX', rng),
    APP: rollCharacteristic('APP', rng),
    INT: rollCharacteristic('INT', rng),
    POW: rollCharacteristic('POW', rng),
    EDU: rollCharacteristic('EDU', rng),
  }
}

/** Optional point-buy method from the 7e core rules. */
export const POINT_BUY_BUDGET = 460
export const POINT_BUY_MIN = 15
export const POINT_BUY_MAX = 90

export function pointBuySpent(chars: Characteristics): number {
  return Object.values(chars).reduce((a, b) => a + b, 0)
}

export interface PointBuyStatus {
  spent: number
  remaining: number
  valid: boolean
  errors: string[]
}

export function validatePointBuy(chars: Characteristics): PointBuyStatus {
  const spent = pointBuySpent(chars)
  const errors: string[] = []
  for (const [name, value] of Object.entries(chars)) {
    if (value < POINT_BUY_MIN || value > POINT_BUY_MAX) {
      errors.push(`${name} must be between ${POINT_BUY_MIN} and ${POINT_BUY_MAX}`)
    }
  }
  if (spent !== POINT_BUY_BUDGET) {
    errors.push(`Spend exactly ${POINT_BUY_BUDGET} points (currently ${spent})`)
  }
  return { spent, remaining: POINT_BUY_BUDGET - spent, valid: errors.length === 0, errors }
}

/** Manual entry: any value 1–99 is accepted. */
export function validateManual(chars: Characteristics): string[] {
  const errors: string[] = []
  for (const [name, value] of Object.entries(chars)) {
    if (!Number.isInteger(value) || value < 1 || value > 99) {
      errors.push(`${name} must be a whole number between 1 and 99`)
    }
  }
  return errors
}

export function halfValue(value: number): number {
  return Math.floor(value / 2)
}

export function fifthValue(value: number): number {
  return Math.floor(value / 5)
}
