import { useCreatorStore, WIZARD_STEPS } from './state/store'
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
          <button key={name} className={i === step ? 'active' : ''} onClick={() => setStep(i)}>
            {i + 1}. {name}
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
