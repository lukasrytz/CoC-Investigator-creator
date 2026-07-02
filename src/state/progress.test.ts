import { describe, expect, it } from 'vitest'
import { stepStatuses, type ProgressInput } from './progress'
import { emptyInvestigator, type Characteristics } from '../rules/types'

const chars = (v: number): Characteristics => ({
  STR: v, CON: v, SIZ: v, DEX: v, APP: v, INT: v, POW: v, EDU: v,
})

function fresh(): ProgressInput {
  return {
    genMethod: 'roll',
    baseCharacteristics: chars(0),
    deductionSplit: {},
    investigator: emptyInvestigator(),
  }
}

describe('stepStatuses', () => {
  it('starts with everything incomplete', () => {
    expect(stepStatuses(fresh())).toEqual(Array(8).fill('incomplete'))
  })

  it('marks basics complete once named', () => {
    const s = fresh()
    s.investigator.name = 'Nora Blake'
    expect(stepStatuses(s)[0]).toBe('complete')
  })

  it('characteristics need luck; then complete', () => {
    const s = fresh()
    s.baseCharacteristics = chars(50)
    s.investigator.characteristics = chars(50)
    expect(stepStatuses(s)[1]).toBe('attention') // luck missing
    s.investigator.luck = 45
    expect(stepStatuses(s)[1]).toBe('complete')
  })

  it('flags allocation problems on the right step', () => {
    const s = fresh()
    s.baseCharacteristics = chars(50)
    s.investigator.characteristics = chars(50)
    s.investigator.luck = 45
    s.investigator.occupationId = 'journalist'
    // Occupation pool: EDU 50 × 4 = 200; personal: INT 50 × 2 = 100
    s.investigator.skills = [
      { skillId: 'history', occupationPoints: 300, personalPoints: 0 }, // overspend + cap
    ]
    const statuses = stepStatuses(s)
    expect(statuses[3]).toBe('attention')
    expect(statuses[7]).toBe('attention') // review reflects problems

    s.investigator.skills = [
      { skillId: 'history', occupationPoints: 60, personalPoints: 0 },
      { skillId: 'library-use', occupationPoints: 60, personalPoints: 0 },
      { skillId: 'psychology', occupationPoints: 60, personalPoints: 0 },
      { skillId: 'credit-rating', occupationPoints: 20, personalPoints: 0 },
      { skillId: 'dodge', occupationPoints: 0, personalPoints: 60 },
      { skillId: 'listen', occupationPoints: 0, personalPoints: 40 },
    ]
    const done = stepStatuses(s)
    expect(done[3]).toBe('complete') // 200 occupation points spent, CR 20 in range
    expect(done[4]).toBe('complete') // 100 personal points spent
  })

  it('review completes only when everything else does', () => {
    const s = fresh()
    s.genMethod = 'manual'
    s.baseCharacteristics = chars(50)
    s.investigator.characteristics = chars(50)
    s.investigator.name = 'Nora'
    s.investigator.luck = 45
    s.investigator.occupationId = 'journalist'
    s.investigator.skills = [
      { skillId: 'history', occupationPoints: 60, personalPoints: 0 },
      { skillId: 'library-use', occupationPoints: 60, personalPoints: 0 },
      { skillId: 'psychology', occupationPoints: 60, personalPoints: 0 },
      { skillId: 'credit-rating', occupationPoints: 20, personalPoints: 0 },
      { skillId: 'dodge', occupationPoints: 0, personalPoints: 60 },
      { skillId: 'listen', occupationPoints: 0, personalPoints: 40 },
    ]
    s.investigator.backstory = {
      ideology: 'a', significantPeople: 'b', meaningfulLocations: 'c',
      treasuredPossessions: 'd', traits: 'e', keyConnection: 'ideology',
    }
    s.investigator.gear = ['Flashlight']
    expect(stepStatuses(s)).toEqual(Array(8).fill('complete'))
  })
})
