import { useState } from 'react'
import { useCreatorStore } from '../../state/store'
import { validateAllocation } from '../../rules/allocation'
import { finances1920s, formatDollars } from '../../rules/finance'
import { GEAR_CATALOG_1920S, gearLabel, gearPlausibility, gearSpending, parseGearPrice } from '../../rules/gear'
import { occupationById } from '../../rules/occupations'
import { skillById } from '../../rules/skills'

export default function GearStep() {
  const inv = useCreatorStore((s) => s.investigator)
  const setGear = useCreatorStore((s) => s.setGear)
  const setNotes = useCreatorStore((s) => s.setNotes)
  const [draft, setDraft] = useState('')

  const { creditRating } = validateAllocation(inv)
  const fin = finances1920s(creditRating)
  const { spent } = gearSpending(inv.gear, fin)
  const remaining = fin.cash - spent
  const occupation = inv.occupationId ? occupationById(inv.occupationId) : undefined

  const allItems = GEAR_CATALOG_1920S.flatMap((c) => c.items)
  const unusualOwned = allItems.filter(
    (item) => inv.gear.includes(gearLabel(item)) && gearPlausibility(item, occupation, inv.skills) === 'unusual',
  )

  const add = (item: string) => {
    const trimmed = item.trim()
    if (trimmed && !inv.gear.includes(trimmed)) setGear([...inv.gear, trimmed])
  }

  return (
    <>
      <div className="card">
        <h2>Finances (1920s)</h2>
        <div className="derived-strip">
          <div className="derived-box"><div className="label">Credit Rating</div><div className="value">{creditRating}</div></div>
          <div className="derived-box"><div className="label">Standard of living</div><div className="value">{fin.label}</div></div>
          <div className="derived-box"><div className="label">Spending level</div><div className="value">{formatDollars(fin.spendingLevel)}</div></div>
          <div className="derived-box"><div className="label">Cash</div><div className="value">{formatDollars(fin.cash)}</div></div>
          <div className="derived-box"><div className="label">Assets</div><div className="value">{fin.assetsNote ?? formatDollars(fin.assets)}</div></div>
          <div className="derived-box"><div className="label">Spent on gear</div><div className="value">{formatDollars(spent)}</div></div>
          <div className={remaining < 0 ? 'derived-box overspent' : 'derived-box'}>
            <div className="label">Cash remaining</div>
            <div className="value">{remaining < 0 ? `−${formatDollars(-remaining)}` : formatDollars(remaining)}</div>
          </div>
        </div>
        <p className="hint">
          Purchases up to your spending level ({formatDollars(fin.spendingLevel)}) are covered by your standard of
          living; anything dearer comes out of cash.
        </p>
        {remaining < 0 && (
          <p className="keeper-note">
            Overspent by {formatDollars(-remaining)} — the Keeper may want a word about where the money came from.
          </p>
        )}
      </div>

      <div className="card">
        <h2>Gear & possessions</h2>
        <div className="spec-add">
          <input
            type="text"
            value={draft}
            placeholder="Add an item…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                add(draft)
                setDraft('')
              }
            }}
          />
          <button
            className="ghost"
            onClick={() => {
              add(draft)
              setDraft('')
            }}
          >
            Add
          </button>
        </div>
        <ul className="gear-list">
          {inv.gear.map((item) => (
            <li key={item}>
              {item}
              <button className="small" onClick={() => setGear(inv.gear.filter((g) => g !== item))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        {unusualOwned.length > 0 && occupation && (
          <p className="keeper-note">
            {unusualOwned.map((item) => (
              <span key={item.name}>
                A {item.name} looks out of place on a {occupation.name.toLowerCase()} — no{' '}
                {skillById(item.skill!).name} in the occupation and no points in the skill.{' '}
              </span>
            ))}
          </p>
        )}
        <div className="gear-catalog">
          {GEAR_CATALOG_1920S.map((cat, i) => {
            const remainingItems = cat.items.filter((item) => !inv.gear.includes(gearLabel(item)))
            return (
              <details key={cat.name} open={i === 0}>
                <summary>
                  {cat.name} <span className="gear-count">({remainingItems.length})</span>
                </summary>
                <div className="gear-suggestions">
                  {remainingItems.map((item) => {
                    const price = item.price ? parseGearPrice(gearLabel(item)) : undefined
                    const overBudget = price !== undefined && price > fin.spendingLevel && price > remaining
                    const unusual = gearPlausibility(item, occupation, inv.skills) === 'unusual'
                    return (
                      <button
                        key={item.name}
                        className="small"
                        title={
                          unusual
                            ? `No ${skillById(item.skill!).name} in a ${occupation!.name.toLowerCase()}’s line of work`
                            : overBudget
                              ? 'Costs more than your remaining cash'
                              : undefined
                        }
                        onClick={() => add(gearLabel(item))}
                      >
                        + {item.name}
                        {unusual && <span className="gear-flag"> ⚠</span>}
                        {item.price && <span className={overBudget ? 'gear-price over' : 'gear-price'}> {item.price}</span>}
                      </button>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
        <label className="field" style={{ marginTop: '0.8rem' }}>
          <span>Notes</span>
          <textarea value={inv.notes} onChange={(e) => setNotes(e.target.value)} placeholder="Spending money, vehicles, property…" />
        </label>
      </div>
    </>
  )
}
