import { useState } from 'react'
import { useCreatorStore } from '../../state/store'
import { OCCUPATIONS } from '../../rules/occupations'
import { occupationPoints, formulaLabel, personalInterestPoints } from '../../rules/allocation'
import { skillById } from '../../rules/skills'
import type { OccupationSkillSlot } from '../../rules/types'

function slotLabel(slot: OccupationSkillSlot): string {
  if (slot.kind === 'fixed') {
    const name = skillById(slot.skillId).name
    return slot.spec ? `${name} (${slot.spec})` : name
  }
  if (slot.kind === 'choice') return slot.label
  return slot.count === 1 ? 'any one other skill' : `any ${slot.count} other skills`
}

export default function OccupationStep() {
  const inv = useCreatorStore((s) => s.investigator)
  const setOccupation = useCreatorStore((s) => s.setOccupation)
  const [filter, setFilter] = useState('')

  const shown = OCCUPATIONS.filter((o) => o.name.toLowerCase().includes(filter.toLowerCase()))
  const selected = OCCUPATIONS.find((o) => o.id === inv.occupationId) ?? null
  const hasChars = inv.characteristics.EDU > 0

  return (
    <div className="card">
      <h2>Occupation</h2>
      <div className="occ-layout">
        <div>
          <label className="field">
            <span>Search</span>
            <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter occupations…" />
          </label>
          <div className="occ-list">
            {shown.map((o) => (
              <button
                key={o.id}
                className={o.id === inv.occupationId ? 'selected' : ''}
                onClick={() => setOccupation(o.id)}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>
        <div className="occ-detail">
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
              <p className="meta">
                <strong>Skill points:</strong> {formulaLabel(selected.points)}
                {hasChars && <> = <strong>{occupationPoints(selected.points, inv.characteristics)}</strong></>}
                <br />
                <strong>Credit Rating:</strong> {selected.creditRating.min}–{selected.creditRating.max}
                <br />
                <strong>Personal interest points:</strong> INT × 2
                {hasChars && <> = <strong>{personalInterestPoints(inv.characteristics)}</strong></>}
              </p>
              <strong>Occupation skills:</strong>
              <ul>
                {selected.slots.map((slot, i) => (
                  <li key={i}>{slotLabel(slot)}</li>
                ))}
              </ul>
              <p className="meta">
                <strong>Suggested contacts:</strong> {selected.suggestedContacts}
              </p>
            </>
          ) : (
            <p className="meta">Select an occupation to see its skills, credit rating range and point formula.</p>
          )}
        </div>
      </div>
    </div>
  )
}
