import { describe, expect, it } from 'vitest'
import { seededRng, rollDie, roll3d6x5, roll2d6plus6x5 } from './dice'
import {
  rollAllCharacteristics,
  validatePointBuy,
  validateManual,
  POINT_BUY_BUDGET,
  halfValue,
  fifthValue,
} from './characteristics'
import {
  hitPoints,
  magicPoints,
  startingSanity,
  damageBonusAndBuild,
  baseMove,
  move,
  derivedStats,
} from './derived'
import {
  ageBracket,
  runEduImprovementChecks,
  validateDeductionSplit,
  applyAgeModifiers,
} from './age'
import { SKILLS, skillBase, skillById } from './skills'
import { OCCUPATIONS, occupationById } from './occupations'
import {
  occupationPoints,
  personalInterestPoints,
  validateAllocation,
  skillTotal,
} from './allocation'
import { finances1920s } from './finance'
import { GEAR_CATALOG_1920S, gearLabel } from './gear'
import type { Characteristics, Investigator } from './types'
import { emptyInvestigator } from './types'

const chars = (over: Partial<Characteristics> = {}): Characteristics => ({
  STR: 50,
  CON: 50,
  SIZ: 50,
  DEX: 50,
  APP: 50,
  INT: 50,
  POW: 50,
  EDU: 50,
  ...over,
})

describe('dice', () => {
  it('rolls within bounds', () => {
    const rng = seededRng(42)
    for (let i = 0; i < 1000; i++) {
      const d = rollDie(6, rng)
      expect(d).toBeGreaterThanOrEqual(1)
      expect(d).toBeLessThanOrEqual(6)
    }
  })

  it('3D6×5 is between 15 and 90 and a multiple of 5', () => {
    const rng = seededRng(1)
    for (let i = 0; i < 500; i++) {
      const v = roll3d6x5(rng)
      expect(v).toBeGreaterThanOrEqual(15)
      expect(v).toBeLessThanOrEqual(90)
      expect(v % 5).toBe(0)
    }
  })

  it('(2D6+6)×5 is between 40 and 90', () => {
    const rng = seededRng(2)
    for (let i = 0; i < 500; i++) {
      const v = roll2d6plus6x5(rng)
      expect(v).toBeGreaterThanOrEqual(40)
      expect(v).toBeLessThanOrEqual(90)
    }
  })

  it('seeded rng is deterministic', () => {
    expect(rollAllCharacteristics(seededRng(7))).toEqual(rollAllCharacteristics(seededRng(7)))
  })
})

describe('point buy', () => {
  it('accepts a valid 460-point spread', () => {
    const spread = chars({ STR: 40, CON: 60, SIZ: 60, DEX: 60, APP: 40, INT: 70, POW: 60, EDU: 70 })
    expect(Object.values(spread).reduce((a, b) => a + b)).toBe(POINT_BUY_BUDGET)
    expect(validatePointBuy(spread).valid).toBe(true)
  })

  it('rejects overspend and out-of-range values', () => {
    const status = validatePointBuy(chars({ STR: 95 }))
    expect(status.valid).toBe(false)
    expect(status.errors.some((e) => e.includes('STR'))).toBe(true)
  })

  it('manual entry validates range', () => {
    expect(validateManual(chars())).toEqual([])
    expect(validateManual(chars({ INT: 0 }))).toHaveLength(1)
    expect(validateManual(chars({ INT: 100 }))).toHaveLength(1)
  })
})

describe('derived stats', () => {
  it('computes HP, MP, SAN', () => {
    const c = chars({ CON: 55, SIZ: 60, POW: 65 })
    expect(hitPoints(c)).toBe(11)
    expect(magicPoints(c)).toBe(13)
    expect(startingSanity(c)).toBe(65)
  })

  it('half and fifth values round down', () => {
    expect(halfValue(45)).toBe(22)
    expect(fifthValue(45)).toBe(9)
  })

  it('damage bonus table edges', () => {
    expect(damageBonusAndBuild(chars({ STR: 30, SIZ: 34 }))).toEqual({ damageBonus: '-2', build: -2 })
    expect(damageBonusAndBuild(chars({ STR: 30, SIZ: 35 }))).toEqual({ damageBonus: '-1', build: -1 })
    expect(damageBonusAndBuild(chars({ STR: 40, SIZ: 45 }))).toEqual({ damageBonus: '0', build: 0 })
    expect(damageBonusAndBuild(chars({ STR: 60, SIZ: 65 }))).toEqual({ damageBonus: '+1D4', build: 1 })
    expect(damageBonusAndBuild(chars({ STR: 80, SIZ: 85 }))).toEqual({ damageBonus: '+1D6', build: 2 })
  })

  it('move rate from STR/DEX vs SIZ', () => {
    expect(baseMove(chars({ STR: 40, DEX: 40, SIZ: 50 }))).toBe(7)
    expect(baseMove(chars({ STR: 50, DEX: 40, SIZ: 50 }))).toBe(8)
    expect(baseMove(chars({ STR: 60, DEX: 60, SIZ: 50 }))).toBe(9)
    expect(baseMove(chars({ STR: 50, DEX: 50, SIZ: 50 }))).toBe(8)
  })

  it('age reduces MOV', () => {
    const c = chars({ STR: 60, DEX: 60, SIZ: 50 })
    expect(move(c, 25)).toBe(9)
    expect(move(c, 45)).toBe(8)
    expect(move(c, 85)).toBe(4)
    expect(derivedStats(c, 45).move).toBe(8)
  })
})

describe('age modifiers', () => {
  it('finds the right bracket', () => {
    expect(ageBracket(15).luckTwice).toBe(true)
    expect(ageBracket(25).eduImprovementChecks).toBe(1)
    expect(ageBracket(45).physicalDeduction).toBe(5)
    expect(ageBracket(89).physicalDeduction).toBe(80)
    expect(() => ageBracket(14)).toThrow()
    expect(() => ageBracket(90)).toThrow()
  })

  it('EDU improvement checks add 1D10 when d100 > EDU, capped at 99', () => {
    const { results, eduAfter } = runEduImprovementChecks(50, 4, seededRng(3))
    expect(results).toHaveLength(4)
    for (const r of results) {
      if (r.improved) {
        expect(r.gain).toBeGreaterThanOrEqual(1)
        expect(r.gain).toBeLessThanOrEqual(10)
      } else {
        expect(r.gain).toBe(0)
      }
    }
    expect(eduAfter).toBeLessThanOrEqual(99)
    // EDU 99 can never improve (d100 max is 100 > 99 is possible... roll must exceed EDU)
    const capped = runEduImprovementChecks(99, 4, seededRng(4))
    expect(capped.eduAfter).toBe(99)
  })

  it('validates deduction splits', () => {
    expect(validateDeductionSplit(45, { STR: 3, DEX: 2 })).toEqual([])
    expect(validateDeductionSplit(45, { STR: 5, DEX: 2 })).not.toEqual([])
    expect(validateDeductionSplit(45, { SIZ: 5 })).not.toEqual([])
    expect(validateDeductionSplit(17, { STR: 2, SIZ: 3 })).toEqual([])
    expect(validateDeductionSplit(25, {})).toEqual([])
  })

  it('applies teen modifiers (EDU −5, 5 from STR/SIZ)', () => {
    const result = applyAgeModifiers(chars(), 17, { STR: 5 }, 50)
    expect(result.STR).toBe(45)
    expect(result.EDU).toBe(45)
    expect(result.APP).toBe(50)
  })

  it('applies older modifiers (APP loss, EDU after checks)', () => {
    const result = applyAgeModifiers(chars(), 55, { STR: 4, CON: 3, DEX: 3 }, 68)
    expect(result.STR).toBe(46)
    expect(result.CON).toBe(47)
    expect(result.DEX).toBe(47)
    expect(result.APP).toBe(40)
    expect(result.EDU).toBe(68)
  })
})

describe('skills', () => {
  it('has unique ids', () => {
    const ids = SKILLS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves special base values', () => {
    const c = chars({ DEX: 65, EDU: 70 })
    expect(skillBase(skillById('dodge'), c)).toBe(32)
    expect(skillBase(skillById('language-own'), c)).toBe(70)
    expect(skillBase(skillById('spot-hidden'), c)).toBe(25)
  })
})

describe('occupations', () => {
  it('has unique ids and valid skill references', () => {
    const ids = OCCUPATIONS.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const occ of OCCUPATIONS) {
      for (const slot of occ.slots) {
        if (slot.kind === 'fixed') expect(() => skillById(slot.skillId)).not.toThrow()
        if (slot.kind === 'choice') {
          for (const id of slot.from) expect(() => skillById(id)).not.toThrow()
          expect(slot.count).toBeLessThanOrEqual(slot.from.length)
        }
      }
      expect(occ.creditRating.min).toBeLessThanOrEqual(occ.creditRating.max)
    }
  })

  it('computes occupation points', () => {
    const c = chars({ EDU: 70, DEX: 60, STR: 40 })
    expect(occupationPoints({ kind: 'edu4' }, c)).toBe(280)
    expect(occupationPoints({ kind: 'edu2plus', other: ['DEX', 'STR'] }, c)).toBe(260)
    expect(personalInterestPoints(chars({ INT: 65 }))).toBe(130)
  })
})

describe('allocation validation', () => {
  const journalist = (): Investigator => {
    const inv = emptyInvestigator()
    inv.characteristics = chars({ EDU: 70, INT: 60 }) // 280 occupation, 120 personal
    inv.occupationId = 'journalist'
    return inv
  }

  it('accepts a legal build', () => {
    const inv = journalist()
    inv.skills = [
      { skillId: 'art-craft', spec: 'Photography', occupationPoints: 40, personalPoints: 0 },
      { skillId: 'history', occupationPoints: 40, personalPoints: 0 },
      { skillId: 'library-use', occupationPoints: 40, personalPoints: 0 },
      { skillId: 'language-own', occupationPoints: 10, personalPoints: 0 },
      { skillId: 'charm', occupationPoints: 40, personalPoints: 0 }, // interpersonal choice
      { skillId: 'psychology', occupationPoints: 40, personalPoints: 0 },
      { skillId: 'stealth', occupationPoints: 30, personalPoints: 0 }, // any #1
      { skillId: 'spot-hidden', occupationPoints: 20, personalPoints: 40 }, // any #2
      { skillId: 'credit-rating', occupationPoints: 20, personalPoints: 0 },
      { skillId: 'dodge', occupationPoints: 0, personalPoints: 30 },
    ]
    const status = validateAllocation(inv)
    expect(status.errors).toEqual([])
    expect(status.occupationSpent).toBe(280)
    expect(status.occupationRemaining).toBe(0)
    expect(status.personalSpent).toBe(70)
    expect(status.creditRating).toBe(20)
  })

  it('rejects occupation points on non-occupation skills beyond free picks', () => {
    const inv = journalist()
    inv.skills = [
      { skillId: 'stealth', occupationPoints: 10, personalPoints: 0 },
      { skillId: 'dodge', occupationPoints: 10, personalPoints: 0 },
      { skillId: 'swim', occupationPoints: 10, personalPoints: 0 }, // 3rd non-listed: over the 2 'any' picks
      { skillId: 'credit-rating', occupationPoints: 10, personalPoints: 0 },
    ]
    const status = validateAllocation(inv)
    expect(status.errors.some((e) => e.includes('not one of the occupation'))).toBe(true)
  })

  it('rejects overspend, cap violations, out-of-range credit rating and Mythos points', () => {
    const inv = journalist()
    inv.skills = [
      { skillId: 'library-use', occupationPoints: 85, personalPoints: 0 }, // base 20 → 105 > 99
      { skillId: 'credit-rating', occupationPoints: 50, personalPoints: 0 }, // max 30 for journalist
      { skillId: 'cthulhu-mythos', occupationPoints: 0, personalPoints: 5 },
      { skillId: 'history', occupationPoints: 200, personalPoints: 130 },
    ]
    const status = validateAllocation(inv)
    expect(status.errors.some((e) => e.includes('maximum of 99'))).toBe(true)
    expect(status.errors.some((e) => e.includes('Credit Rating must be between'))).toBe(true)
    expect(status.errors.some((e) => e.includes('Cthulhu Mythos'))).toBe(true)
    expect(status.errors.some((e) => e.includes('Occupation points overspent'))).toBe(true)
    expect(status.errors.some((e) => e.includes('Personal interest points overspent'))).toBe(true)
  })

  it('requires credit rating within range even when zero', () => {
    const inv = journalist()
    inv.skills = []
    const status = validateAllocation(inv)
    expect(status.errors.some((e) => e.includes('Credit Rating'))).toBe(true)
  })

  it('computes skill totals', () => {
    const c = chars({ DEX: 60 })
    expect(skillTotal({ skillId: 'dodge', occupationPoints: 10, personalPoints: 5 }, c)).toBe(45)
  })

  it('supports custom skills', () => {
    const inv = journalist()
    inv.customSkills = [{ id: 'custom-lip-reading', name: 'Lip Reading', base: 1 }]
    inv.skills = [
      { skillId: 'custom-lip-reading', occupationPoints: 0, personalPoints: 30 },
      { skillId: 'credit-rating', occupationPoints: 10, personalPoints: 0 },
    ]
    const status = validateAllocation(inv)
    expect(status.errors).toEqual([])
    expect(status.personalSpent).toBe(30)
    expect(skillTotal(inv.skills[0], inv.characteristics, inv.customSkills)).toBe(31)

    // Occupation points on a custom skill consume a free pick; Journalist has two.
    inv.skills = [
      { skillId: 'custom-lip-reading', occupationPoints: 20, personalPoints: 0 },
      { skillId: 'stealth', occupationPoints: 20, personalPoints: 0 },
      { skillId: 'dodge', occupationPoints: 20, personalPoints: 0 },
      { skillId: 'credit-rating', occupationPoints: 10, personalPoints: 0 },
    ]
    const overPicks = validateAllocation(inv)
    expect(overPicks.errors.some((e) => e.includes('not one of the occupation'))).toBe(true)
  })
})

describe('finances (1920s)', () => {
  it('maps credit rating to wealth bands', () => {
    expect(finances1920s(0)).toMatchObject({ label: 'Penniless', cash: 0.5 })
    expect(finances1920s(5)).toMatchObject({ label: 'Poor', cash: 5, assets: 50 })
    expect(finances1920s(30)).toMatchObject({ label: 'Average', cash: 60, assets: 1500, spendingLevel: 10 })
    expect(finances1920s(60)).toMatchObject({ label: 'Wealthy', cash: 300, assets: 30000 })
    expect(finances1920s(95)).toMatchObject({ label: 'Rich', cash: 1900, spendingLevel: 250 })
    expect(finances1920s(99)).toMatchObject({ label: 'Super Rich', cash: 50000 })
  })
})

describe('occupation lookup', () => {
  it('finds occupations by id', () => {
    expect(occupationById('journalist').name).toBe('Journalist')
    expect(() => occupationById('astronaut')).toThrow()
  })
})

describe('gear catalog', () => {
  it('has non-empty categories with unique item names', () => {
    const names = new Set<string>()
    for (const cat of GEAR_CATALOG_1920S) {
      expect(cat.items.length).toBeGreaterThan(0)
      for (const item of cat.items) {
        expect(names.has(item.name)).toBe(false)
        names.add(item.name)
      }
    }
  })

  it('sorts items alphabetically within each category', () => {
    for (const cat of GEAR_CATALOG_1920S) {
      const sorted = [...cat.items].sort((a, b) => a.name.localeCompare(b.name))
      expect(cat.items.map((i) => i.name)).toEqual(sorted.map((i) => i.name))
    }
  })

  it('formats prices consistently and labels items with them', () => {
    for (const cat of GEAR_CATALOG_1920S) {
      for (const item of cat.items) {
        if (item.price) expect(item.price).toMatch(/^\$\d+\.\d{2}$/)
      }
    }
    expect(gearLabel({ name: 'Flashlight', price: '$2.00' })).toBe('Flashlight ($2.00)')
    expect(gearLabel({ name: 'Newspaper clippings file' })).toBe('Newspaper clippings file')
  })
})
