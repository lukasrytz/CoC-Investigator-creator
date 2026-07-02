import { useMemo } from 'react'
import { useCreatorStore, WIZARD_STEPS } from './state/store'
import { stepStatuses } from './state/progress'
import BasicsStep from './components/wizard/BasicsStep'
import CharacteristicsStep from './components/wizard/CharacteristicsStep'
import OccupationStep from './components/wizard/OccupationStep'
import SkillsStep from './components/wizard/SkillsStep'
import BackstoryStep from './components/wizard/BackstoryStep'
import GearStep from './components/wizard/GearStep'
import ReviewStep from './components/wizard/ReviewStep'

export default function App() {
  const step = useCreatorStore((s) => s.step)
  const setStep = useCreatorStore((s) => s.setStep)
  const reset = useCreatorStore((s) => s.reset)
  const genMethod = useCreatorStore((s) => s.genMethod)
  const baseCharacteristics = useCreatorStore((s) => s.baseCharacteristics)
  const deductionSplit = useCreatorStore((s) => s.deductionSplit)
  const investigator = useCreatorStore((s) => s.investigator)
  const statuses = useMemo(
    () => stepStatuses({ genMethod, baseCharacteristics, deductionSplit, investigator }),
    [genMethod, baseCharacteristics, deductionSplit, investigator],
  )

  const steps = [
    <BasicsStep key="basics" />,
    <CharacteristicsStep key="chars" />,
    <OccupationStep key="occ" />,
    <SkillsStep key="occ-skills" pool="occupationPoints" />,
    <SkillsStep key="personal-skills" pool="personalPoints" />,
    <BackstoryStep key="backstory" />,
    <GearStep key="gear" />,
    <ReviewStep key="review" />,
  ]

  return (
    <>
      <header className="app-header no-print">
        <div>
          <h1>Investigator Creator</h1>
          <div className="subtitle">Call of Cthulhu, 7th Edition — 1920s</div>
        </div>
        <button
          className="small"
          onClick={() => {
            if (confirm('Discard this investigator and start over?')) reset()
          }}
        >
          Start over
        </button>
      </header>

      <nav className="steps-nav no-print">
        {WIZARD_STEPS.map((name, i) => (
          <button
            key={name}
            className={i === step ? 'active' : ''}
            onClick={() => setStep(i)}
            title={statuses[i] === 'attention' ? 'This step has problems' : statuses[i] === 'complete' ? 'Complete' : undefined}
          >
            {i + 1}. {name}
            {statuses[i] === 'complete' && <span className="tab-mark done">✓</span>}
            {statuses[i] === 'attention' && <span className="tab-mark attention">!</span>}
          </button>
        ))}
      </nav>

      {steps[step]}

      <div className="wizard-footer no-print">
        <button className="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
          ← Back
        </button>
        <button
          className="primary"
          disabled={step === WIZARD_STEPS.length - 1}
          onClick={() => setStep(step + 1)}
        >
          Next →
        </button>
      </div>
    </>
  )
}
