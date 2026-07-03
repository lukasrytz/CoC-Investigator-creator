import { useState } from 'react'
import { useCreatorStore } from '../../state/store'
import { SKILLS, skillBase } from '../../rules/skills'
import { occupationById } from '../../rules/occupations'
import { validateAllocation, SKILL_CAP } from '../../rules/allocation'
import { halfValue, fifthValue } from '../../rules/characteristics'
import type { SkillAllocation, SkillDef } from '../../rules/types'
import Tags from '../Tags'

type Pool = 'occupationPoints' | 'personalPoints'

interface Row {
  def: SkillDef
  spec?: string
  alloc: SkillAllocation | undefined
  customId?: string
}

export default function SkillsStep({ pool }: { pool: Pool }) {
  const inv = useCreatorStore((s) => s.investigator)
  const setSkillPoints = useCreatorStore((s) => s.setSkillPoints)
  const addSpecialization = useCreatorStore((s) => s.addSpecialization)
  const removeSpecialization = useCreatorStore((s) => s.removeSpecialization)
  const addCustomSkill = useCreatorStore((s) => s.addCustomSkill)
  const removeCustomSkill = useCreatorStore((s) => s.removeCustomSkill)
  const [specDrafts, setSpecDrafts] = useState<Record<string, string>>({})
  const [customName, setCustomName] = useState('')
  const [customBase, setCustomBase] = useState(1)

  const occupation = inv.occupationId ? occupationById(inv.occupationId) : null
  const status = validateAllocation(inv)
  const isOccupationStep = pool === 'occupationPoints'

  if (isOccupationStep && !occupation) {
    return (
      <div className="card">
        <h2>Occupation skills</h2>
        <p className="occ-detail meta">Choose an occupation first (previous step).</p>
      </div>
    )
  }

  const occupationSkillIds = new Set<string>()
  if (occupation) {
    for (const slot of occupation.slots) {
      if (slot.kind === 'fixed') occupationSkillIds.add(slot.skillId)
      if (slot.kind === 'choice') for (const id of slot.from) occupationSkillIds.add(id)
    }
  }

  const findAlloc = (skillId: string, spec?: string) =>
    inv.skills.find((a) => a.skillId === skillId && (a.spec ?? '') === (spec ?? ''))

  const customSkills = inv.customSkills ?? []
  const rows: Row[] = []
  for (const def of [...SKILLS].sort((a, b) => a.name.localeCompare(b.name))) {
    if (def.specializable) {
      const allocs = inv.skills.filter((a) => a.skillId === def.id)
      for (const alloc of allocs) rows.push({ def, spec: alloc.spec, alloc })
    } else {
      rows.push({ def, alloc: findAlloc(def.id) })
    }
  }
  for (const custom of [...customSkills].sort((a, b) => a.name.localeCompare(b.name))) {
    rows.push({
      def: { id: custom.id, name: custom.name, base: custom.base, category: 'special' },
      alloc: findAlloc(custom.id),
      customId: custom.id,
    })
  }

  const chars = inv.characteristics

  return (
    <>
      <div className="card">
        <h2>{isOccupationStep ? 'Occupation skill points' : 'Personal interest points'}</h2>
        <div className="pool-strip">
          {isOccupationStep ? (
            <>
              <div className={`pool ${status.occupationRemaining < 0 ? 'over' : ''}`}>
                Occupation points: <strong>{status.occupationRemaining}</strong> / {status.occupationPool} left
              </div>
              <div className="pool">
                Credit Rating: <strong>{status.creditRating}</strong>{' '}
                {occupation && (
                  <span className="cr-note">
                    (required: {occupation.creditRating.min}–{occupation.creditRating.max})
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className={`pool ${status.personalRemaining < 0 ? 'over' : ''}`}>
              Personal interest points (INT × 2): <strong>{status.personalRemaining}</strong> / {status.personalPool} left
            </div>
          )}
        </div>
        {isOccupationStep ? (
          <p className="occ-detail meta">
            Spend occupation points on the skills marked in <span style={{ color: 'var(--accent)', fontWeight: 600 }}>red</span>{' '}
            (your occupation's skills), your free picks, and Credit Rating. Maximum {SKILL_CAP} in any skill.
          </p>
        ) : (
          <p className="occ-detail meta">
            Spend INT × 2 points on any skills except Cthulhu Mythos. Maximum {SKILL_CAP} in any skill.
          </p>
        )}

        <table className="skills">
          <thead>
            <tr>
              <th>Skill</th>
              <th className="num">Base</th>
              <th className="num">Occ.</th>
              <th className="num">Pers.</th>
              <th className="num">Total</th>
              <th className="num">½ / ⅕</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ def, spec, alloc, customId }) => {
              const base = skillBase(def, chars)
              const occPts = alloc?.occupationPoints ?? 0
              const persPts = alloc?.personalPoints ?? 0
              const total = base + occPts + persPts
              const locked = def.lockedAtCreation
              const isOcc = occupationSkillIds.has(def.id) || def.id === 'credit-rating'
              const name = spec ? `${def.name} (${spec})` : def.name
              return (
                <tr key={`${def.id}|${spec ?? ''}`} className={`${isOcc && isOccupationStep ? 'occ-skill' : ''} ${locked ? 'locked' : ''}`}>
                  <td>
                    {name} <Tags tags={def.tags} />
                    {def.id === 'credit-rating' && occupation && isOccupationStep && (
                      <span className="cr-note"> — required {occupation.creditRating.min}–{occupation.creditRating.max}</span>
                    )}
                    {def.specializable && spec && (
                      <>
                        {' '}
                        <button className="small" title="Remove specialization" onClick={() => removeSpecialization(def.id, spec)}>
                          ✕
                        </button>
                      </>
                    )}
                    {customId && (
                      <>
                        {' '}
                        <span className="cr-note">(custom)</span>{' '}
                        <button className="small" title="Remove custom skill" onClick={() => removeCustomSkill(customId)}>
                          ✕
                        </button>
                      </>
                    )}
                  </td>
                  <td className="num">{base}</td>
                  <td className="num">
                    {isOccupationStep && !locked ? (
                      <input
                        type="number"
                        min={0}
                        value={occPts || ''}
                        placeholder="0"
                        onChange={(e) => setSkillPoints(def.id, spec, 'occupationPoints', Number(e.target.value))}
                      />
                    ) : (
                      occPts || '·'
                    )}
                  </td>
                  <td className="num">
                    {!isOccupationStep && !locked ? (
                      <input
                        type="number"
                        min={0}
                        value={persPts || ''}
                        placeholder="0"
                        onChange={(e) => setSkillPoints(def.id, spec, 'personalPoints', Number(e.target.value))}
                      />
                    ) : (
                      persPts || '·'
                    )}
                  </td>
                  <td className="num">
                    <strong style={total > SKILL_CAP ? { color: 'var(--accent)' } : undefined}>{total}</strong>
                  </td>
                  <td className="num">
                    {halfValue(total)} / {fifthValue(total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <h3>Add a specialization</h3>
        <p className="occ-detail meta">
          Art/Craft, Fighting, Language (Other), Pilot, Science and Survival take a specialization, e.g. Science
          (Biology). Additional languages go here: add a Language (Other) specialization per tongue.
        </p>
        {SKILLS.filter((d) => d.specializable).map((def) => (
          <div className="spec-add" key={def.id} style={{ marginBottom: '0.4rem' }}>
            <span style={{ width: '9.5rem', display: 'inline-block' }}>{def.name}</span>
            <input
              type="text"
              placeholder="Specialization…"
              value={specDrafts[def.id] ?? ''}
              onChange={(e) => setSpecDrafts({ ...specDrafts, [def.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addSpecialization(def.id, specDrafts[def.id] ?? '')
                  setSpecDrafts({ ...specDrafts, [def.id]: '' })
                }
              }}
            />
            <button
              className="small"
              onClick={() => {
                addSpecialization(def.id, specDrafts[def.id] ?? '')
                setSpecDrafts({ ...specDrafts, [def.id]: '' })
              }}
            >
              Add
            </button>
          </div>
        ))}

        <h3>Add a custom skill</h3>
        <p className="occ-detail meta">
          For skills outside the core list (with your Keeper's approval), e.g. Lip Reading. Set the base value your
          Keeper allows — most custom skills start at 1&#37;.
        </p>
        <div className="spec-add">
          <input
            type="text"
            placeholder="Skill name…"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addCustomSkill(customName, customBase)
                setCustomName('')
              }
            }}
          />
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Base &#37;</span>
            <input
              type="number"
              min={0}
              max={99}
              value={customBase}
              onChange={(e) => setCustomBase(Math.floor(Number(e.target.value)) || 0)}
            />
          </label>
          <button
            className="small"
            onClick={() => {
              addCustomSkill(customName, customBase)
              setCustomName('')
            }}
          >
            Add
          </button>
        </div>
      </div>

      {status.errors.length > 0 && (
        <div className="errors">
          <strong>Allocation problems:</strong>
          <ul>
            {status.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {status.errors.length === 0 && (
        <div className="ok-banner">Skill allocation is valid so far.</div>
      )}
    </>
  )
}
