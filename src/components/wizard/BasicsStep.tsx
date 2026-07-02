import { useCreatorStore } from '../../state/store'
import { MIN_AGE, MAX_AGE, ageBracket } from '../../rules/age'

export default function BasicsStep() {
  const inv = useCreatorStore((s) => s.investigator)
  const setBasics = useCreatorStore((s) => s.setBasics)
  const setAge = useCreatorStore((s) => s.setAge)

  const bracket = ageBracket(inv.age)
  const ageNotes: string[] = []
  if (bracket.luckTwice) ageNotes.push('rolls Luck twice and keeps the better result')
  if (bracket.eduDeduction) ageNotes.push(`EDU −${bracket.eduDeduction}`)
  if (bracket.physicalDeduction)
    ageNotes.push(`distribute ${bracket.physicalDeduction} points of deductions among ${bracket.deductFrom.join('/')}`)
  if (bracket.appDeduction) ageNotes.push(`APP −${bracket.appDeduction}`)
  if (bracket.eduImprovementChecks)
    ageNotes.push(`${bracket.eduImprovementChecks} EDU improvement check${bracket.eduImprovementChecks > 1 ? 's' : ''}`)
  if (bracket.movePenalty) ageNotes.push(`MOV −${bracket.movePenalty}`)

  return (
    <div className="card">
      <h2>Who is your investigator?</h2>
      <div className="grid-2">
        <label className="field">
          <span>Name</span>
          <input type="text" value={inv.name} onChange={(e) => setBasics({ name: e.target.value })} placeholder="e.g. Harvey Walters" />
        </label>
        <label className="field">
          <span>Player</span>
          <input type="text" value={inv.player} onChange={(e) => setBasics({ player: e.target.value })} />
        </label>
        <label className="field">
          <span>Birthplace</span>
          <input type="text" value={inv.birthplace} onChange={(e) => setBasics({ birthplace: e.target.value })} placeholder="e.g. Boston, Mass." />
        </label>
        <label className="field">
          <span>Residence</span>
          <input type="text" value={inv.residence} onChange={(e) => setBasics({ residence: e.target.value })} placeholder="e.g. Arkham, Mass." />
        </label>
        <label className="field">
          <span>Sex / Gender</span>
          <input type="text" value={inv.sex} onChange={(e) => setBasics({ sex: e.target.value })} />
        </label>
        <label className="field">
          <span>Age ({MIN_AGE}–{MAX_AGE})</span>
          <input
            type="number"
            min={MIN_AGE}
            max={MAX_AGE}
            value={inv.age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </label>
      </div>
      {ageNotes.length > 0 && (
        <p className="occ-detail meta">
          Age {bracket.min}–{bracket.max}: {ageNotes.join('; ')}. Applied in the Characteristics step.
        </p>
      )}
    </div>
  )
}
