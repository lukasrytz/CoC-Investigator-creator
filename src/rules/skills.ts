import type { Characteristics, CustomSkill, SkillDef } from './types'
import { halfValue } from './characteristics'

/**
 * Core 7e skill list (1920s era) with base values.
 * Specializable skills (Art/Craft, Science, ...) get one entry; the UI adds
 * a specialization string per allocation.
 */
export const SKILLS: readonly SkillDef[] = [
  { id: 'accounting', name: 'Accounting', base: 5, category: 'mental' },
  { id: 'animal-handling', name: 'Animal Handling', base: 5, category: 'physical' },
  { id: 'anthropology', name: 'Anthropology', base: 1, category: 'mental' },
  { id: 'artillery', name: 'Artillery', base: 1, category: 'combat' },
  { id: 'appraise', name: 'Appraise', base: 5, category: 'mental' },
  { id: 'archaeology', name: 'Archaeology', base: 1, category: 'mental' },
  { id: 'art-craft', name: 'Art/Craft', base: 5, category: 'technical', specializable: true },
  { id: 'charm', name: 'Charm', base: 15, category: 'communication' },
  { id: 'climb', name: 'Climb', base: 20, category: 'physical' },
  { id: 'credit-rating', name: 'Credit Rating', base: 0, category: 'special' },
  { id: 'cthulhu-mythos', name: 'Cthulhu Mythos', base: 0, category: 'special', lockedAtCreation: true },
  { id: 'demolitions', name: 'Demolitions', base: 1, category: 'technical' },
  { id: 'disguise', name: 'Disguise', base: 5, category: 'technical' },
  { id: 'diving', name: 'Diving', base: 1, category: 'physical' },
  { id: 'dodge', name: 'Dodge', base: 'halfDEX', category: 'combat' },
  { id: 'drive-auto', name: 'Drive Auto', base: 20, category: 'physical' },
  { id: 'electrical-repair', name: 'Elec. Repair', base: 10, category: 'technical' },
  { id: 'fast-talk', name: 'Fast Talk', base: 5, category: 'communication' },
  { id: 'fighting-brawl', name: 'Fighting (Brawl)', base: 25, category: 'combat' },
  { id: 'fighting', name: 'Fighting', base: 20, category: 'combat', specializable: true },
  { id: 'firearms-handgun', name: 'Firearms (Handgun)', base: 20, category: 'combat' },
  { id: 'firearms-rifle-shotgun', name: 'Firearms (Rifle/Shotgun)', base: 25, category: 'combat' },
  { id: 'first-aid', name: 'First Aid', base: 30, category: 'technical' },
  { id: 'history', name: 'History', base: 5, category: 'mental' },
  { id: 'hypnosis', name: 'Hypnosis', base: 1, category: 'mental' },
  { id: 'intimidate', name: 'Intimidate', base: 15, category: 'communication' },
  { id: 'jump', name: 'Jump', base: 20, category: 'physical' },
  { id: 'language-other', name: 'Language (Other)', base: 1, category: 'mental', specializable: true },
  { id: 'language-own', name: 'Language (Own)', base: 'EDU', category: 'mental' },
  { id: 'law', name: 'Law', base: 5, category: 'mental' },
  { id: 'library-use', name: 'Library Use', base: 20, category: 'mental' },
  { id: 'listen', name: 'Listen', base: 20, category: 'perception' },
  { id: 'locksmith', name: 'Locksmith', base: 1, category: 'technical' },
  { id: 'lore', name: 'Lore', base: 1, category: 'mental', specializable: true },
  { id: 'mechanical-repair', name: 'Mech. Repair', base: 10, category: 'technical' },
  { id: 'medicine', name: 'Medicine', base: 1, category: 'mental' },
  { id: 'natural-world', name: 'Natural World', base: 10, category: 'mental' },
  { id: 'navigate', name: 'Navigate', base: 10, category: 'mental' },
  { id: 'occult', name: 'Occult', base: 5, category: 'mental' },
  { id: 'operate-heavy-machinery', name: 'Op. Hv. Machine', base: 1, category: 'technical' },
  { id: 'persuade', name: 'Persuade', base: 10, category: 'communication' },
  { id: 'pilot', name: 'Pilot', base: 1, category: 'technical', specializable: true },
  { id: 'psychoanalysis', name: 'Psychoanalysis', base: 1, category: 'mental' },
  { id: 'read-lips', name: 'Read Lips', base: 1, category: 'perception' },
  { id: 'psychology', name: 'Psychology', base: 10, category: 'perception' },
  { id: 'ride', name: 'Ride', base: 5, category: 'physical' },
  { id: 'science', name: 'Science', base: 1, category: 'mental', specializable: true },
  { id: 'sleight-of-hand', name: 'Sleight of Hand', base: 10, category: 'technical' },
  { id: 'spot-hidden', name: 'Spot Hidden', base: 25, category: 'perception' },
  { id: 'stealth', name: 'Stealth', base: 20, category: 'physical' },
  { id: 'survival', name: 'Survival', base: 10, category: 'physical', specializable: true },
  { id: 'swim', name: 'Swim', base: 20, category: 'physical' },
  { id: 'throw', name: 'Throw', base: 20, category: 'combat' },
  { id: 'track', name: 'Track', base: 10, category: 'perception' },
]

const byId = new Map(SKILLS.map((s) => [s.id, s]))

export function skillById(id: string): SkillDef {
  const skill = byId.get(id)
  if (!skill) throw new Error(`Unknown skill: ${id}`)
  return skill
}

/**
 * Resolve a skill id to its definition, checking the investigator's custom
 * skills first (their ids carry the "custom-" prefix).
 */
export function resolveSkill(customSkills: readonly CustomSkill[] | undefined, id: string): SkillDef {
  const custom = customSkills?.find((c) => c.id === id)
  if (custom) return { id: custom.id, name: custom.name, base: custom.base, category: 'special' }
  return skillById(id)
}

/** Resolve a skill's base value against the investigator's characteristics. */
export function skillBase(def: SkillDef, chars: Characteristics): number {
  if (def.base === 'halfDEX') return halfValue(chars.DEX)
  if (def.base === 'EDU') return chars.EDU
  return def.base
}
