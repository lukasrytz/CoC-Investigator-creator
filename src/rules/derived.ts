import type { Characteristics, DerivedStats } from './types'
import { ageBracket } from './age'

export function hitPoints(chars: Characteristics): number {
  return Math.floor((chars.CON + chars.SIZ) / 10)
}

export function magicPoints(chars: Characteristics): number {
  return Math.floor(chars.POW / 5)
}

export function startingSanity(chars: Characteristics): number {
  return chars.POW
}

export interface DamageBonusEntry {
  damageBonus: string
  build: number
}

/** Damage bonus and build from STR + SIZ (human range of the 7e table). */
export function damageBonusAndBuild(chars: Characteristics): DamageBonusEntry {
  const sum = chars.STR + chars.SIZ
  if (sum <= 64) return { damageBonus: '-2', build: -2 }
  if (sum <= 84) return { damageBonus: '-1', build: -1 }
  if (sum <= 124) return { damageBonus: '0', build: 0 }
  if (sum <= 164) return { damageBonus: '+1D4', build: 1 }
  return { damageBonus: '+1D6', build: 2 }
}

/** Base MOV before the age penalty. */
export function baseMove(chars: Characteristics): number {
  const { STR, DEX, SIZ } = chars
  if (STR > SIZ && DEX > SIZ) return 9
  if (STR >= SIZ || DEX >= SIZ) return 8
  return 7
}

export function move(chars: Characteristics, age: number): number {
  return baseMove(chars) - ageBracket(age).movePenalty
}

export function derivedStats(chars: Characteristics, age: number): DerivedStats {
  const { damageBonus, build } = damageBonusAndBuild(chars)
  return {
    hitPoints: hitPoints(chars),
    magicPoints: magicPoints(chars),
    sanity: startingSanity(chars),
    damageBonus,
    build,
    move: move(chars, age),
  }
}
