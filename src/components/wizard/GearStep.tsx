import { useState } from 'react'
import { useCreatorStore } from '../../state/store'
import { validateAllocation } from '../../rules/allocation'
import { finances1920s, formatDollars } from '../../rules/finance'
import { GEAR_CATALOG_1920S, gearLabel } from '../../rules/gear'

export default function GearStep() {
  const inv = useCreatorStore((s) => s.investigator)
  const setGear = useCreatorStore((s) => s.setGear)
  const setNotes = useCreatorStore((s) => s.setNotes)
  const [draft, setDraft] = useState('')

  const { creditRating } = validateAllocation(inv)
  const fin = finances1920s(creditRating)

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
        </div>
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
        <div className="gear-catalog">
          {GEAR_CATALOG_1920S.map((cat, i) => {
            const remaining = cat.items.filter((item) => !inv.gear.includes(gearLabel(item)))
            return (
              <details key={cat.name} open={i === 0}>
                <summary>
                  {cat.name} <span className="gear-count">({remaining.length})</span>
                </summary>
                <div className="gear-suggestions">
                  {remaining.map((item) => (
                    <button key={item.name} className="small" onClick={() => add(gearLabel(item))}>
                      + {item.name}
                      {item.price && <span className="gear-price"> {item.price}</span>}
                    </button>
                  ))}
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
