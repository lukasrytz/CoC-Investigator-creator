import { useLayoutEffect, useRef } from 'react'
import type { Investigator } from '../../rules/types'
import { CHARACTERISTIC_NAMES } from '../../rules/types'
import { SKILLS, skillBase } from '../../rules/skills'
import { halfValue, fifthValue } from '../../rules/characteristics'
import { derivedStats } from '../../rules/derived'
import { occupationById } from '../../rules/occupations'
import { validateAllocation } from '../../rules/allocation'
import { finances1920s, formatDollars } from '../../rules/finance'
import { gearSpending } from '../../rules/gear'
import {
  CornerFlourish,
  SectionDivider,
  HeaderEmblem,
  TentacleFlourish,
  CoffeeRing,
  InkBlot,
} from './ornaments'

const BACKSTORY_LABELS: Record<string, string> = {
  ideology: 'Ideology / Beliefs',
  significantPeople: 'Significant People',
  meaningfulLocations: 'Meaningful Locations',
  treasuredPossessions: 'Treasured Possessions',
  traits: 'Traits',
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="sheet-page">
      <CornerFlourish className="corner corner-tl" />
      <CornerFlourish className="corner corner-tr" />
      <CornerFlourish className="corner corner-bl" />
      <CornerFlourish className="corner corner-br" />
      <div className="sheet-page-inner">{children}</div>
    </div>
  )
}

export default function CharacterSheet({ inv }: { inv: Investigator }) {
  const chars = inv.characteristics
  const derived = derivedStats(chars, inv.age)
  const occupation = inv.occupationId ? occupationById(inv.occupationId) : null
  const { creditRating } = validateAllocation(inv)
  const fin = finances1920s(creditRating)
  const { spent: gearSpent } = gearSpending(inv.gear, fin)

  // One row per skill (specializable skills appear once per specialization).
  // Modern-era skills stay off the 1920s sheet unless points were put in them.
  const skillRows = [...SKILLS]
    .filter(
      (def) =>
        !def.tags?.includes('modern') ||
        inv.skills.some((a) => a.skillId === def.id && a.occupationPoints + a.personalPoints > 0),
    )
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
    .concat(
      (inv.customSkills ?? []).map((custom) => {
        const alloc = inv.skills.find((a) => a.skillId === custom.id)
        return {
          name: custom.name,
          total: custom.base + (alloc?.occupationPoints ?? 0) + (alloc?.personalPoints ?? 0),
        }
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  // The sheet is laid out at fixed A4 width; on narrow screens (phones) it is
  // scaled down as a whole, like a PDF preview, instead of reflowing. Print is
  // unaffected (transform reset in the print stylesheet).
  const viewportRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const sheet = sheetRef.current
    if (!viewport || !sheet) return
    const update = () => {
      const scale = Math.min(1, viewport.clientWidth / sheet.offsetWidth)
      if (scale < 1) {
        sheet.style.transform = `scale(${scale})`
        viewport.style.height = `${sheet.offsetHeight * scale}px`
      } else {
        sheet.style.transform = ''
        viewport.style.height = ''
      }
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="sheet-viewport" ref={viewportRef}>
    <div className="sheet" id="character-sheet" ref={sheetRef}>
      <PageFrame>
        <CoffeeRing className="stain stain-ring-1" />
        <div className="sheet-header">
          <HeaderEmblem className="sheet-emblem" />
          <div className="sheet-titles">
            <div className="sheet-super">Case File — Investigator Record</div>
            <h2 className="sheet-title">Call of Cthulhu</h2>
            <div className="sheet-sub">Seventh Edition · 1920s</div>
          </div>
          <HeaderEmblem className="sheet-emblem" />
        </div>

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

        <SectionDivider label="Characteristics" />
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

        <SectionDivider label="Skills" />
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

        <SectionDivider label="Weapons" />
        <table className="sheet-weapons">
          <thead>
            <tr>
              <th>Weapon</th>
              <th>Skill %</th>
              <th>Damage</th>
              <th>Range</th>
              <th>Attacks</th>
              <th>Ammo</th>
              <th>Malf.</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }, (_, i) => (
              <tr key={i}>
                <td /><td /><td /><td /><td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>

        <SectionDivider label="Wounds & Conditions" />
        <div className="note-lines">
          <div className="note-line" />
          <div className="note-line" />
        </div>
      </PageFrame>

      <PageFrame>
        <InkBlot className="stain stain-blot-1" />
        <CoffeeRing className="stain stain-ring-2" />
        <div className="sheet-header sheet-header-small">
          <div className="sheet-titles">
            <div className="sheet-super">{inv.name || 'Investigator'} — continued</div>
          </div>
        </div>

        <SectionDivider label="Backstory" />
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

        <SectionDivider label="Gear & Possessions" />
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

        <SectionDivider label="Finances" />
        <div>
          Credit Rating {creditRating} — {fin.label}. Spending level {formatDollars(fin.spendingLevel)}, cash{' '}
          {formatDollars(fin.cash)}, assets {fin.assetsNote ?? formatDollars(fin.assets)}.
          {gearSpent > 0 && (
            <>
              {' '}
              Spent on gear {formatDollars(gearSpent)}, cash remaining{' '}
              {fin.cash - gearSpent < 0
                ? `−${formatDollars(gearSpent - fin.cash)}`
                : formatDollars(fin.cash - gearSpent)}
              .
            </>
          )}
        </div>

        {inv.notes && (
          <>
            <SectionDivider label="Notes" />
            <div>{inv.notes}</div>
          </>
        )}

        <SectionDivider label="Field Notes" />
        <div className="note-lines">
          {Array.from({ length: 12 }, (_, i) => (
            <div className="note-line" key={i} />
          ))}
        </div>

        <TentacleFlourish className="sheet-tentacles" />
      </PageFrame>
    </div>
    </div>
  )
}
