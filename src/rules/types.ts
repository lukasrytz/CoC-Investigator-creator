export const CHARACTERISTIC_NAMES = [
  'STR',
  'CON',
  'SIZ',
  'DEX',
  'APP',
  'INT',
  'POW',
  'EDU',
] as const

export type CharacteristicName = (typeof CHARACTERISTIC_NAMES)[number]

export type Characteristics = Record<CharacteristicName, number>

export interface DerivedStats {
  hitPoints: number
  magicPoints: number
  sanity: number
  damageBonus: string
  build: number
  move: number
}

export type SkillCategory =
  | 'combat'
  | 'communication'
  | 'mental'
  | 'physical'
  | 'perception'
  | 'technical'
  | 'special'

export interface SkillDef {
  /** Stable identifier, e.g. "spot-hidden" or "science" for specializable skills. */
  id: string
  name: string
  /** Base value in percent; special bases are resolved via baseFor(). */
  base: number | 'halfDEX' | 'EDU'
  category: SkillCategory
  /** Skill takes a specialization, e.g. Art/Craft (Photography). */
  specializable?: boolean
  /** Cannot receive points at creation (Cthulhu Mythos). */
  lockedAtCreation?: boolean
}

/** One of the four interpersonal skills, referenced by occupation choice slots. */
export const INTERPERSONAL_SKILL_IDS = ['charm', 'fast-talk', 'intimidate', 'persuade'] as const

/**
 * An occupation grants eight skill slots. A slot is either a fixed skill,
 * a choice from a listed group, or a free pick of any skill.
 */
export type OccupationSkillSlot =
  | { kind: 'fixed'; skillId: string; spec?: string }
  | { kind: 'choice'; count: number; from: readonly string[]; label: string }
  | { kind: 'any'; count: number }

export type PointsFormula =
  | { kind: 'edu4' } // EDU × 4
  | { kind: 'edu2plus'; other: readonly CharacteristicName[] } // EDU × 2 + best-of(other) × 2

export interface Occupation {
  id: string
  name: string
  description: string
  points: PointsFormula
  creditRating: { min: number; max: number }
  slots: readonly OccupationSkillSlot[]
  suggestedContacts: string
}

/** A skill the investigator has put points into (or that has a spec). */
export interface SkillAllocation {
  skillId: string
  /** Specialization text for specializable skills. */
  spec?: string
  occupationPoints: number
  personalPoints: number
}

export interface Backstory {
  ideology: string
  significantPeople: string
  meaningfulLocations: string
  treasuredPossessions: string
  traits: string
  /** Which backstory entry is the key connection. */
  keyConnection: '' | keyof Omit<Backstory, 'keyConnection'>
}

export interface Investigator {
  name: string
  player: string
  age: number
  birthplace: string
  residence: string
  sex: string
  characteristics: Characteristics
  luck: number
  occupationId: string | null
  skills: SkillAllocation[]
  backstory: Backstory
  gear: string[]
  /** Free-text notes about spending money etc. */
  notes: string
}

export function emptyBackstory(): Backstory {
  return {
    ideology: '',
    significantPeople: '',
    meaningfulLocations: '',
    treasuredPossessions: '',
    traits: '',
    keyConnection: '',
  }
}

export function emptyInvestigator(): Investigator {
  return {
    name: '',
    player: '',
    age: 25,
    birthplace: '',
    residence: '',
    sex: '',
    characteristics: { STR: 0, CON: 0, SIZ: 0, DEX: 0, APP: 0, INT: 0, POW: 0, EDU: 0 },
    luck: 0,
    occupationId: null,
    skills: [],
    backstory: emptyBackstory(),
    gear: [],
    notes: '',
  }
}
