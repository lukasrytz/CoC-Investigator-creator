import { useCreatorStore } from '../../state/store'
import { BACKSTORY_TABLES, rollBackstory, type BackstoryTableKey } from '../../rules/backstoryTables'
import type { Backstory } from '../../rules/types'

const FIELDS: { key: BackstoryTableKey & keyof Backstory; label: string; hint: string }[] = [
  { key: 'ideology', label: 'Ideology / Beliefs', hint: 'What does your investigator hold true?' },
  { key: 'significantPeople', label: 'Significant People', hint: 'Who matters most — and why?' },
  { key: 'meaningfulLocations', label: 'Meaningful Locations', hint: 'A place close to their heart.' },
  { key: 'treasuredPossessions', label: 'Treasured Possessions', hint: 'Something they would never give up.' },
  { key: 'traits', label: 'Traits', hint: 'A quality that defines them.' },
]

export default function BackstoryStep() {
  const backstory = useCreatorStore((s) => s.investigator.backstory)
  const setBackstory = useCreatorStore((s) => s.setBackstory)

  return (
    <div className="card">
      <h2>Backstory</h2>
      <p className="occ-detail meta">
        Write your own entries or use the dice button for a random prompt to riff on. Then mark one entry as your{' '}
        <strong>key connection</strong> — the anchor that helps your investigator recover sanity.
      </p>
      {FIELDS.map(({ key, label, hint }) => (
        <div className="backstory-field" key={key}>
          <label className="field" style={{ marginBottom: '0.2rem' }}>
            <span>
              {label}
              {backstory.keyConnection === key && <em className="key-connection"> — key connection</em>}
            </span>
          </label>
          <div className="row">
            <textarea
              value={backstory[key]}
              placeholder={hint}
              onChange={(e) => setBackstory({ [key]: e.target.value })}
            />
            <button
              className="ghost"
              title={`Random prompt (1D${BACKSTORY_TABLES[key].length})`}
              onClick={() => {
                const prompt = rollBackstory(key)
                setBackstory({ [key]: backstory[key] ? `${backstory[key]}\n${prompt}` : prompt })
              }}
            >
              🎲
            </button>
          </div>
        </div>
      ))}
      <label className="field">
        <span>Key connection</span>
        <select
          value={backstory.keyConnection}
          onChange={(e) => setBackstory({ keyConnection: e.target.value as Backstory['keyConnection'] })}
          style={{ maxWidth: '20rem' }}
        >
          <option value="">— choose one —</option>
          {FIELDS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
