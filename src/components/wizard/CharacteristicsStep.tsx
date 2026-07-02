import { useState } from 'react'
import { useCreatorStore, type GenMethod } from '../../state/store'
import { CHARACTERISTIC_NAMES, type CharacteristicName } from '../../rules/types'
import {
  validatePointBuy,
  validateManual,
  POINT_BUY_BUDGET,
  POINT_BUY_MIN,
  POINT_BUY_MAX,
  halfValue,
  fifthValue,
} from '../../rules/characteristics'
import { ageBracket, validateDeductionSplit } from '../../rules/age'
import { derivedStats } from '../../rules/derived'

const METHODS: { id: GenMethod; label: string }[] = [
  { id: 'roll', label: 'Roll dice' },
  { id: 'pointbuy', label: 'Point buy' },
  { id: 'manual', label: 'Manual entry' },
]

export default function CharacteristicsStep() {
  const s = useCreatorStore()
  const inv = s.investigator
  const bracket = ageBracket(inv.age)

  const [swapA, setSwapA] = useState<CharacteristicName>('STR')
  const [swapB, setSwapB] = useState<CharacteristicName>('DEX')

  const errors: string[] = []
  if (s.genMethod === 'pointbuy') errors.push(...validatePointBuy(s.baseCharacteristics).errors)
  if (s.genMethod === 'manual') errors.push(...validateManual(s.baseCharacteristics))
  if (bracket.physicalDeduction > 0) errors.push(...validateDeductionSplit(inv.age, s.deductionSplit))
  if (inv.luck === 0) errors.push('Roll or enter Luck')

  const hasValues = Object.values(s.baseCharacteristics).some((v) => v > 0)
  const derived = hasValues ? derivedStats(inv.characteristics, inv.age) : null
  const pointBuy = s.genMethod === 'pointbuy' ? validatePointBuy(s.baseCharacteristics) : null

  return (
    <>
      <div className="card">
        <h2>Characteristics</h2>
        <div className="method-tabs">
          {METHODS.map((m) => (
            <button key={m.id} className={s.genMethod === m.id ? 'active' : ''} onClick={() => s.setGenMethod(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        {s.genMethod === 'roll' && (
          <>
            <p className="occ-detail meta">
              STR, CON, DEX, APP and POW roll 3D6×5; SIZ, INT and EDU roll (2D6+6)×5.
            </p>
            <button className="primary" onClick={s.rollCharacteristics}>
              {s.hasRolled ? 'Re-roll all characteristics' : 'Roll characteristics'}
            </button>
          </>
        )}
        {s.genMethod === 'pointbuy' && (
          <p className="occ-detail meta">
            Spend exactly {POINT_BUY_BUDGET} points; each characteristic between {POINT_BUY_MIN} and {POINT_BUY_MAX}.{' '}
            <strong>{pointBuy!.remaining}</strong> points remaining.
          </p>
        )}
        {s.genMethod === 'manual' && (
          <p className="occ-detail meta">Enter values directly (1–99), e.g. from dice rolled at the table.</p>
        )}

        <div className="char-grid">
          {CHARACTERISTIC_NAMES.map((name) => {
            const base = s.baseCharacteristics[name]
            const final = inv.characteristics[name]
            const delta = final - base
            return (
              <div className="char-box" key={name}>
                <div className="char-name">{name}</div>
                {s.genMethod === 'roll' ? (
                  <div className="char-value">{base || '—'}</div>
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={base || ''}
                    onChange={(e) => s.setBaseCharacteristic(name, Math.floor(Number(e.target.value)) || 0)}
                  />
                )}
                <div className="char-mod">{delta !== 0 ? `${delta > 0 ? '+' : ''}${delta} age → ${final}` : ''}</div>
                <div className="char-frac">½ {halfValue(final)} · ⅕ {fifthValue(final)}</div>
              </div>
            )
          })}
        </div>

        {s.genMethod === 'roll' && s.hasRolled && (
          <div className="spec-add">
            <span className="occ-detail meta">Optional: swap two rolled values —</span>
            <select value={swapA} onChange={(e) => setSwapA(e.target.value as CharacteristicName)}>
              {CHARACTERISTIC_NAMES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <select value={swapB} onChange={(e) => setSwapB(e.target.value as CharacteristicName)}>
              {CHARACTERISTIC_NAMES.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button className="small" onClick={() => s.swapBaseCharacteristics(swapA, swapB)} disabled={swapA === swapB}>
              Swap
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Age modifiers (age {inv.age})</h3>
        {bracket.physicalDeduction > 0 ? (
          <>
            <p className="occ-detail meta">
              Distribute <strong>{bracket.physicalDeduction}</strong> points of deductions among{' '}
              {bracket.deductFrom.join(', ')}.
              {bracket.appDeduction > 0 && <> APP −{bracket.appDeduction} is applied automatically.</>}
              {bracket.eduDeduction > 0 && <> EDU −{bracket.eduDeduction} is applied automatically.</>}
            </p>
            <div className="spec-add">
              {bracket.deductFrom.map((name) => (
                <label key={name} className="field" style={{ marginBottom: 0 }}>
                  <span>−{name}</span>
                  <input
                    type="number"
                    min={0}
                    max={bracket.physicalDeduction}
                    value={s.deductionSplit[name] ?? 0}
                    onChange={(e) => s.setDeduction(name, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          </>
        ) : (
          <p className="occ-detail meta">No characteristic deductions at this age.</p>
        )}

        {bracket.eduImprovementChecks > 0 && (
          <>
            <h3>EDU improvement checks ({bracket.eduImprovementChecks})</h3>
            {s.eduChecks.length === 0 ? (
              <p className="occ-detail meta">Rolled automatically once characteristics are set.</p>
            ) : (
              <ul className="occ-detail meta">
                {s.eduChecks.map((c, i) => (
                  <li key={i}>
                    Check {i + 1}: rolled {c.roll} — {c.improved ? `success, EDU +${c.gain} → ${c.eduAfter}` : 'no improvement'}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <h3>Luck</h3>
        <div className="spec-add">
          <button className="ghost" onClick={s.rollLuck}>
            Roll Luck (3D6×5{bracket.luckTwice ? ', twice, keep best' : ''})
          </button>
          <input
            type="number"
            min={0}
            max={99}
            value={inv.luck || ''}
            onChange={(e) => s.setLuck(Math.floor(Number(e.target.value)) || 0)}
            placeholder="Luck"
          />
          {s.luckRolls.length > 1 && (
            <span className="occ-detail meta">rolled {s.luckRolls.join(' and ')}, kept {Math.max(...s.luckRolls)}</span>
          )}
        </div>
      </div>

      {derived && (
        <div className="card">
          <h3>Derived attributes</h3>
          <div className="derived-strip">
            <div className="derived-box"><div className="label">Hit Points</div><div className="value">{derived.hitPoints}</div></div>
            <div className="derived-box"><div className="label">Magic Points</div><div className="value">{derived.magicPoints}</div></div>
            <div className="derived-box"><div className="label">Sanity</div><div className="value">{derived.sanity}</div></div>
            <div className="derived-box"><div className="label">Luck</div><div className="value">{inv.luck || '—'}</div></div>
            <div className="derived-box"><div className="label">Damage Bonus</div><div className="value">{derived.damageBonus}</div></div>
            <div className="derived-box"><div className="label">Build</div><div className="value">{derived.build}</div></div>
            <div className="derived-box"><div className="label">Move</div><div className="value">{derived.move}</div></div>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="errors">
          <strong>To finish this step:</strong>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
