import { useRef, useState } from 'react'
import { useCreatorStore } from '../../state/store'
import { validateAllocation } from '../../rules/allocation'
import CharacterSheet from '../sheet/CharacterSheet'
import { dumpFieldNames, fillOfficialSheet, type FillReport } from '../../pdf/fillSheet'
import { characterFileMarkdown } from '../../rules/characterFile'

function download(bytes: Uint8Array | string, filename: string, type: string) {
  const blob = new Blob([bytes as BlobPart], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReviewStep() {
  const inv = useCreatorStore((s) => s.investigator)
  const status = validateAllocation(inv)
  const downloadCharacterFile = () => {
    const s = useCreatorStore.getState()
    const md = characterFileMarkdown({
      genMethod: s.genMethod,
      baseCharacteristics: s.baseCharacteristics,
      hasRolled: s.hasRolled,
      deductionSplit: s.deductionSplit,
      eduChecks: s.eduChecks,
      luckRolls: s.luckRolls,
      investigator: s.investigator,
    })
    const slug = (inv.name || 'investigator').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    download(md, `${slug || 'investigator'}.md`, 'text/markdown')
  }
  const fileInput = useRef<HTMLInputElement>(null)
  const [report, setReport] = useState<FillReport | null>(null)
  const [pdfError, setPdfError] = useState('')
  const [busy, setBusy] = useState(false)

  const handlePdf = async (mode: 'fill' | 'dump') => {
    const file = fileInput.current?.files?.[0]
    if (!file) {
      setPdfError('Choose your downloaded copy of the official fillable sheet first.')
      return
    }
    setBusy(true)
    setPdfError('')
    setReport(null)
    try {
      const bytes = await file.arrayBuffer()
      if (mode === 'dump') {
        const names = await dumpFieldNames(bytes)
        download(names.join('\n'), 'pdf-field-names.txt', 'text/plain')
      } else {
        const { bytes: filled, report } = await fillOfficialSheet(bytes, inv)
        setReport(report)
        const name = inv.name.trim().replace(/\s+/g, '-') || 'investigator'
        download(filled, `${name}-coc7e.pdf`, 'application/pdf')
      }
    } catch (e) {
      setPdfError(`Could not process the PDF: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {status.errors.length > 0 ? (
        <div className="errors no-print">
          <strong>This investigator still has problems:</strong>
          <ul>
            {status.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="ok-banner no-print">✓ Complete and rules-legal</div>
      )}

      <div className="card no-print">
        <h2>Output</h2>
        <div className="spec-add" style={{ marginBottom: '0.8rem' }}>
          <button className="primary" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          <span className="occ-detail meta">Uses your browser's print dialog; the sheet below is the print layout.</span>
        </div>

        <div className="spec-add" style={{ marginBottom: '0.8rem' }}>
          <button className="ghost" onClick={downloadCharacterFile}>
            Download character file (.md)
          </button>
          <span className="occ-detail meta">
            A readable Markdown sheet that can be re-uploaded on the first step to continue editing later.
          </span>
        </div>

        <h3>Fill the official fillable PDF</h3>
        <p className="occ-detail meta">
          Download the official fillable 1920s investigator sheet from Chaosium (it is a free download and is not
          bundled with this app), then select it here. Field names vary between sheet versions, so the fill is
          best-effort — the report shows what was matched. “List field names” downloads the PDF's field names to help
          extend the mapping.
        </p>
        <div className="spec-add">
          <input type="file" accept="application/pdf" ref={fileInput} />
          <button className="ghost" disabled={busy} onClick={() => handlePdf('fill')}>
            {busy ? 'Working…' : 'Fill & download'}
          </button>
          <button className="small" disabled={busy} onClick={() => handlePdf('dump')}>
            List field names
          </button>
        </div>
        {pdfError && <div className="errors" style={{ marginTop: '0.6rem' }}>{pdfError}</div>}
        {report && (
          <div className="ok-banner" style={{ marginTop: '0.6rem' }}>
            Filled {report.filled} fields.
            {report.unmatchedFields.length > 0 && (
              <> {report.unmatchedFields.length} text fields in the PDF were not matched (see “List field names”).</>
            )}
          </div>
        )}
      </div>

      <div className="sheet-wrap">
        {status.errors.length === 0 && <div className="sheet-stamp">Cleared for field work</div>}
        <CharacterSheet inv={inv} />
      </div>
    </>
  )
}
