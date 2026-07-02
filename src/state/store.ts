import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  emptyInvestigator,
  type Backstory,
  type CharacteristicName,
  type Characteristics,
  type Investigator,
} from '../rules/types'
import { rollAllCharacteristics } from '../rules/characteristics'
import { roll3d6x5 } from '../rules/dice'
import {
  ageBracket,
  applyAgeModifiers,
  runEduImprovementChecks,
  type DeductionSplit,
  type EduCheckResult,
  MIN_AGE,
  MAX_AGE,
} from '../rules/age'
import { occupationById } from '../rules/occupations'

export type GenMethod = 'roll' | 'pointbuy' | 'manual'

export const WIZARD_STEPS = [
  'Basics',
  'Characteristics',
  'Occupation',
  'Occupation Skills',
  'Personal Interests',
  'Backstory',
  'Gear & Finances',
  'Review & Output',
] as const

export interface CreatorState {
  step: number
  genMethod: GenMethod
  /** Characteristics as generated, before age modifiers. */
  baseCharacteristics: Characteristics
  hasRolled: boolean
  deductionSplit: DeductionSplit
  eduChecks: EduCheckResult[]
  luckRolls: number[]
  investigator: Investigator

  setStep: (step: number) => void
  setGenMethod: (method: GenMethod) => void
  setBasics: (fields: Partial<Pick<Investigator, 'name' | 'player' | 'birthplace' | 'residence' | 'sex'>>) => void
  setAge: (age: number) => void
  rollCharacteristics: () => void
  setBaseCharacteristic: (name: CharacteristicName, value: number) => void
  swapBaseCharacteristics: (a: CharacteristicName, b: CharacteristicName) => void
  setDeduction: (name: keyof DeductionSplit, value: number) => void
  rollLuck: () => void
  setLuck: (value: number) => void
  setOccupation: (id: string) => void
  setSkillPoints: (skillId: string, spec: string | undefined, pool: 'occupationPoints' | 'personalPoints', value: number) => void
  addSpecialization: (skillId: string, spec: string) => void
  removeSpecialization: (skillId: string, spec: string) => void
  addCustomSkill: (name: string, base: number) => void
  removeCustomSkill: (id: string) => void
  setBackstory: (fields: Partial<Backstory>) => void
  setGear: (gear: string[]) => void
  setNotes: (notes: string) => void
  reset: () => void
}

/** Recompute final characteristics and EDU checks from creation inputs. */
function recompute(
  state: Pick<CreatorState, 'baseCharacteristics' | 'deductionSplit' | 'investigator'>,
  opts: { rerollEdu?: boolean; eduChecks?: EduCheckResult[] } = {},
): Pick<CreatorState, 'eduChecks' | 'investigator'> & { eduChecks: EduCheckResult[] } {
  const { baseCharacteristics, deductionSplit, investigator } = state
  const bracket = ageBracket(investigator.age)
  let eduChecks = opts.eduChecks ?? []
  if (opts.rerollEdu) {
    eduChecks = runEduImprovementChecks(baseCharacteristics.EDU, bracket.eduImprovementChecks).results
  }
  const eduAfter = eduChecks.length > 0 ? eduChecks[eduChecks.length - 1].eduAfter : baseCharacteristics.EDU
  const characteristics = applyAgeModifiers(baseCharacteristics, investigator.age, deductionSplit, eduAfter)
  return { eduChecks, investigator: { ...investigator, characteristics } }
}

const initialInvestigator = emptyInvestigator()

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set) => ({
      step: 0,
      genMethod: 'roll',
      baseCharacteristics: { ...initialInvestigator.characteristics },
      hasRolled: false,
      deductionSplit: {},
      eduChecks: [],
      luckRolls: [],
      investigator: initialInvestigator,

      setStep: (step) => set({ step: Math.max(0, Math.min(WIZARD_STEPS.length - 1, step)) }),

      setGenMethod: (genMethod) => set({ genMethod }),

      setBasics: (fields) =>
        set((s) => ({ investigator: { ...s.investigator, ...fields } })),

      setAge: (age) =>
        set((s) => {
          const clamped = Math.max(MIN_AGE, Math.min(MAX_AGE, Math.floor(age) || MIN_AGE))
          const next = { ...s, investigator: { ...s.investigator, age: clamped }, deductionSplit: {} }
          return { deductionSplit: {}, ...recompute(next, { rerollEdu: true }) }
        }),

      rollCharacteristics: () =>
        set((s) => {
          const baseCharacteristics = rollAllCharacteristics()
          const next = { ...s, baseCharacteristics }
          return { baseCharacteristics, hasRolled: true, ...recompute(next, { rerollEdu: true }) }
        }),

      setBaseCharacteristic: (name, value) =>
        set((s) => {
          const baseCharacteristics = { ...s.baseCharacteristics, [name]: value }
          const next = { ...s, baseCharacteristics }
          // Re-run EDU checks only if EDU itself changed.
          return {
            baseCharacteristics,
            ...recompute(next, name === 'EDU' ? { rerollEdu: true } : { eduChecks: s.eduChecks }),
          }
        }),

      swapBaseCharacteristics: (a, b) =>
        set((s) => {
          const baseCharacteristics = {
            ...s.baseCharacteristics,
            [a]: s.baseCharacteristics[b],
            [b]: s.baseCharacteristics[a],
          }
          const next = { ...s, baseCharacteristics }
          const eduChanged = a === 'EDU' || b === 'EDU'
          return {
            baseCharacteristics,
            ...recompute(next, eduChanged ? { rerollEdu: true } : { eduChecks: s.eduChecks }),
          }
        }),

      setDeduction: (name, value) =>
        set((s) => {
          const deductionSplit = { ...s.deductionSplit, [name]: Math.max(0, Math.floor(value) || 0) }
          const next = { ...s, deductionSplit }
          return { deductionSplit, ...recompute(next, { eduChecks: s.eduChecks }) }
        }),

      rollLuck: () =>
        set((s) => {
          const twice = ageBracket(s.investigator.age).luckTwice
          const rolls = twice ? [roll3d6x5(), roll3d6x5()] : [roll3d6x5()]
          return {
            luckRolls: rolls,
            investigator: { ...s.investigator, luck: Math.max(...rolls) },
          }
        }),

      setLuck: (value) =>
        set((s) => ({ luckRolls: [], investigator: { ...s.investigator, luck: value } })),

      setOccupation: (id) =>
        set((s) => {
          const occupation = occupationById(id)
          // Seed zero-point rows for fixed slots with specializations so they
          // show up ready to allocate (e.g. Science (Biology) for a Doctor).
          const skills = [...s.investigator.skills]
          for (const slot of occupation.slots) {
            if (slot.kind !== 'fixed' || !slot.spec) continue
            const exists = skills.some((a) => a.skillId === slot.skillId && a.spec === slot.spec)
            if (!exists) {
              skills.push({ skillId: slot.skillId, spec: slot.spec, occupationPoints: 0, personalPoints: 0 })
            }
          }
          return { investigator: { ...s.investigator, occupationId: id, skills } }
        }),

      setSkillPoints: (skillId, spec, pool, value) =>
        set((s) => {
          const points = Math.max(0, Math.floor(value) || 0)
          const skills = [...s.investigator.skills]
          const idx = skills.findIndex((a) => a.skillId === skillId && (a.spec ?? '') === (spec ?? ''))
          if (idx >= 0) {
            skills[idx] = { ...skills[idx], [pool]: points }
          } else if (points > 0) {
            skills.push({ skillId, spec, occupationPoints: 0, personalPoints: 0, [pool]: points })
          }
          return { investigator: { ...s.investigator, skills } }
        }),

      addSpecialization: (skillId, spec) =>
        set((s) => {
          const trimmed = spec.trim()
          if (!trimmed) return s
          const exists = s.investigator.skills.some(
            (a) => a.skillId === skillId && (a.spec ?? '').toLowerCase() === trimmed.toLowerCase(),
          )
          if (exists) return s
          const skills = [...s.investigator.skills, { skillId, spec: trimmed, occupationPoints: 0, personalPoints: 0 }]
          return { investigator: { ...s.investigator, skills } }
        }),

      removeSpecialization: (skillId, spec) =>
        set((s) => ({
          investigator: {
            ...s.investigator,
            skills: s.investigator.skills.filter((a) => !(a.skillId === skillId && a.spec === spec)),
          },
        })),

      addCustomSkill: (name, base) =>
        set((s) => {
          const trimmed = name.trim()
          if (!trimmed) return s
          const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          const id = `custom-${slug || 'skill'}`
          const customSkills = s.investigator.customSkills ?? []
          if (customSkills.some((c) => c.id === id)) return s
          const clampedBase = Math.max(0, Math.min(99, Math.floor(base) || 0))
          return {
            investigator: {
              ...s.investigator,
              customSkills: [...customSkills, { id, name: trimmed, base: clampedBase }],
            },
          }
        }),

      removeCustomSkill: (id) =>
        set((s) => ({
          investigator: {
            ...s.investigator,
            customSkills: (s.investigator.customSkills ?? []).filter((c) => c.id !== id),
            skills: s.investigator.skills.filter((a) => a.skillId !== id),
          },
        })),

      setBackstory: (fields) =>
        set((s) => ({
          investigator: { ...s.investigator, backstory: { ...s.investigator.backstory, ...fields } },
        })),

      setGear: (gear) => set((s) => ({ investigator: { ...s.investigator, gear } })),

      setNotes: (notes) => set((s) => ({ investigator: { ...s.investigator, notes } })),

      reset: () =>
        set({
          step: 0,
          genMethod: 'roll',
          baseCharacteristics: { ...emptyInvestigator().characteristics },
          hasRolled: false,
          deductionSplit: {},
          eduChecks: [],
          luckRolls: [],
          investigator: emptyInvestigator(),
        }),
    }),
    {
      name: 'coc-investigator-creator',
      version: 1,
      // v0 saves predate custom skills; give them the empty list.
      migrate: (persisted) => {
        const state = persisted as CreatorState
        if (state?.investigator && !state.investigator.customSkills) {
          state.investigator.customSkills = []
        }
        return state
      },
    },
  ),
)
