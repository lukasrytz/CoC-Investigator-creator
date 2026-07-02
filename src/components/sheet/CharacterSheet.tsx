import type { Investigator } from '../../rules/types'
import { CHARACTERISTIC_NAMES } from '../../rules/types'
import { SKILLS, skillBase } from '../../rules/skills'
import { halfValue, fifthValue } from '../../rules/characteristics'
import { derivedStats } from '../../rules/derived'
import { occupationById } from '../../rules/occupations'
import { validateAllocation } from '../../rules/allocation'
import { finances1920s, formatDollars } from '../../rules/finance'

const BACKSTORY_LABELS: Record<string, string> = {
  ideology: 'Ideology / Beliefs',
  significantPeople: 'Significant People',
  meaningfulLocations: 'Meaningful Locations',
  treasuredPossessions: 'Treasured Possessions',
  traits: 'Traits',
}

export default function CharacterSheet({ inv }: { inv: Investigator }) {
  const chars = inv.characteristics
  const derived = derivedStats(chars, inv.age)
  const occupation = inv.occupationId ? occupationById(inv.occupationId) : null
  const { creditRating } = validateAllocation(inv)
  const fin = finances1920s(creditRating)

  // One row per skill (specializable skills appear once per specialization).
  const skillRows = [...SKILLS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((def) => {
      const base = skillBase(def, chars)
      if (def.specializable) {
        const allocs = inv.skills.filter((a) => a.skillId === def.id)
        if (allocs.length === 0) return [{ name: `${def.name} (—)`, total: base }]
        return allocs.map((a) => ({
          name: `${def.name} (${a.spec ?? '—'})`,
          total: base + a.occupationPoints + a.personalPoints,
        }))
      }
      const alloc = inv.skills.find((a) => a.skillId === def.id)
      return [{ name: def.name, total: base + (alloc?.occupationPoints ?? 0) + (alloc?.personalPoints ?? 0) }]
    })

  return (
    <div className="sheet" id="character-sheet">
      <div className="sheet-page">
        <h2 className="sheet-title">Call of Cthulhu — Investigator</h2>
        <div className="sheet-info">
          <div><span>Name</span>{inv.name || '—'}</div>
          <div><span>Player</span>{inv.player || '—'}</div>
          <div><span>Occupation</span>{occupation?.name ?? '—'}</div>
          <div><span>Age</span>{inv.age}</div>
          <div><span>Sex</span>{inv.sex || '—'}</div>
          <div><span>Birthplace</span>{inv.birthplace || '—'}</div>
          <div><span>Residence</span>{inv.residence || '—'}</div>
          <div><span>Era</span>1920s</div>
          <div><span>Standard of Living</span>{fin.label}</div>
        </div>

        <h3>Characteristics</h3>
        <div className="sheet-chars">
          {CHARACTERISTIC_NAMES.map((name) => (
            <div className="char-box" key={name}>
              <div className="char-name">{name}</div>
              <div className="char-value">{chars[name]}</div>
              <div className="char-frac">{halfValue(chars[name])} / {fifthValue(chars[name])}</div>
            </div>
          ))}
        </div>

        <div className="sheet-derived derived-strip">
          <div className="derived-box"><div className="label">Hit Points</div><div className="value">{derived.hitPoints}</div></div>
          <div className="derived-box"><div className="label">Sanity</div><div className="value">{derived.sanity}</div></div>
          <div className="derived-box"><div className="label">Magic Points</div><div className="value">{derived.magicPoints}</div></div>
          <div className="derived-box"><div className="label">Luck</div><div className="value">{inv.luck}</div></div>
          <div className="derived-box"><div className="label">Damage Bonus</div><div className="value">{derived.damageBonus}</div></div>
          <div className="derived-box"><div className="label">Build</div><div className="value">{derived.build}</div></div>
          <div className="derived-box"><div className="label">Move</div><div className="value">{derived.move}</div></div>
        </div>

        <h3>Skills</h3>
        <div className="sheet-skills">
          {skillRows.map((row) => (
            <div className="sheet-skill" key={row.name}>
              <span>{row.name}</span>
              <span className="vals">
                <strong>{row.total}</strong> <span className="frac">{halfValue(row.total)}/{fifthValue(row.total)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sheet-page">
        <h3>Backstory</h3>
        <div className="sheet-backstory">
          {Object.entries(BACKSTORY_LABELS).map(([key, label]) => (
            <div key={key}>
              <span className="bs-label">
                {label}
                {inv.backstory.keyConnection === key ? ' ★ (key connection)' : ''}
                :{' '}
              </span>
              {inv.backstory[key as keyof typeof BACKSTORY_LABELS & keyof typeof inv.backstory] || '—'}
            </div>
          ))}
        </div>

        <h3>Gear & Possessions</h3>
        <div className="sheet-gear">
          {inv.gear.length > 0 ? (
            <ul>
              {inv.gear.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          ) : (
            '—'
          )}
        </div>

        <h3>Finances</h3>
        <div>
          Credit Rating {creditRating} — {fin.label}. Spending level {formatDollars(fin.spendingLevel)}, cash{' '}
          {formatDollars(fin.cash)}, assets {fin.assetsNote ?? formatDollars(fin.assets)}.
        </div>

        {inv.notes && (
          <>
            <h3>Notes</h3>
            <div>{inv.notes}</div>
          </>
        )}
      </div>
    </div>
  )
}
