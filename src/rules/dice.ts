/** Random integer in [1, sides]. */
export type Rng = () => number

export const defaultRng: Rng = Math.random

export function rollDie(sides: number, rng: Rng = defaultRng): number {
  return Math.floor(rng() * sides) + 1
}

export function rollDice(count: number, sides: number, rng: Rng = defaultRng): number {
  let total = 0
  for (let i = 0; i < count; i++) total += rollDie(sides, rng)
  return total
}

/** 3D6 × 5 — used for STR, CON, DEX, APP, POW and Luck. */
export function roll3d6x5(rng: Rng = defaultRng): number {
  return rollDice(3, 6, rng) * 5
}

/** (2D6 + 6) × 5 — used for SIZ, INT, EDU. */
export function roll2d6plus6x5(rng: Rng = defaultRng): number {
  return (rollDice(2, 6, rng) + 6) * 5
}

/** Deterministic RNG (mulberry32) for tests and reproducible rolls. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
