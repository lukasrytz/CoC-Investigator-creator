import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib'
import type { Investigator } from '../rules/types'
import { CHARACTERISTIC_NAMES } from '../rules/types'
import { SKILLS, skillBase } from '../rules/skills'
import { halfValue, fifthValue } from '../rules/characteristics'
import { derivedStats } from '../rules/derived'
import { occupationById } from '../rules/occupations'
import { validateAllocation } from '../rules/allocation'
import { finances1920s, formatDollars } from '../rules/finance'

/**
 * Filling the official fillable sheet: the app does not ship Chaosium's PDF —
 * the user provides their own downloaded copy. Since field names differ
 * between releases of the sheet, matching is heuristic: field names are
 * normalized (lowercased, non-alphanumerics stripped) and looked up against
 * several candidate names per value. The returned report shows what matched
 * so the mapping can be extended.
 */

export interface FillReport {
  filled: number
  matched: { field: string; value: string }[]
  unmatchedFields: string[]
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

interface Target {
  candidates: string[]
  value: string
}

function skillTargets(inv: Investigator): Target[] {
  const chars = inv.characteristics
  const targets: Target[] = []
  for (const def of SKILLS) {
    const base = skillBase(def, chars)
    const allocs = inv.skills.filter((a) => a.skillId === def.id)
    const total =
      base + allocs.reduce((n, a) => n + a.occupationPoints + a.personalPoints, 0)
    const names = [def.name, def.id]
    // Common alternate namings in fillable sheets.
    if (def.id === 'electrical-repair') names.push('Electrical Repair')
    if (def.id === 'mechanical-repair') names.push('Mechanical Repair')
    if (def.id === 'operate-heavy-machinery') names.push('Operate Heavy Machinery', 'Op Heavy Machine')
    if (def.id === 'fighting-brawl') names.push('Fighting Brawl', 'Brawl')
    if (def.id === 'firearms-handgun') names.push('Handgun', 'Firearms Handgun')
    if (def.id === 'firearms-rifle-shotgun') names.push('Rifle Shotgun', 'Firearms Rifle', 'RifleShotgun')
    if (def.id === 'language-own') names.push('Own Language', 'Language Own')
    if (def.id === 'language-other') names.push('Other Language', 'Language Other 1')
    if (def.id === 'natural-world') names.push('Natural World')
    if (def.id === 'credit-rating') names.push('CreditRating', 'CR')
    const candidates = names.flatMap((n) => [n, `skill ${n}`, `${n} value`])
    targets.push({ candidates, value: String(total) })
    targets.push({ candidates: names.map((n) => `${n} half`), value: String(halfValue(total)) })
    targets.push({ candidates: names.map((n) => `${n} fifth`), value: String(fifthValue(total)) })
  }
  return targets
}

export function buildTargets(inv: Investigator): Target[] {
  const chars = inv.characteristics
  const derived = derivedStats(chars, inv.age)
  const occupation = inv.occupationId ? occupationById(inv.occupationId) : null
  const { creditRating } = validateAllocation(inv)
  const fin = finances1920s(creditRating)

  const targets: Target[] = [
    { candidates: ['Investigators Name', 'Investigator Name', 'Name', 'Character Name'], value: inv.name },
    { candidates: ['Player', 'Players Name', 'Player Name'], value: inv.player },
    { candidates: ['Occupation'], value: occupation?.name ?? '' },
    { candidates: ['Age'], value: String(inv.age) },
    { candidates: ['Sex', 'Gender'], value: inv.sex },
    { candidates: ['Birthplace', 'Place of Birth'], value: inv.birthplace },
    { candidates: ['Residence', 'Address'], value: inv.residence },
    { candidates: ['HP', 'Hit Points', 'HitPoints Current', 'Current HP', 'StartingHP'], value: String(derived.hitPoints) },
    { candidates: ['MP', 'Magic Points', 'Current MP', 'StartingMP'], value: String(derived.magicPoints) },
    { candidates: ['SAN', 'Sanity', 'Current Sanity', 'StartingSanity', 'CurrentSAN'], value: String(derived.sanity) },
    { candidates: ['Luck', 'Current Luck', 'StartingLuck'], value: String(inv.luck) },
    { candidates: ['Damage Bonus', 'DB'], value: derived.damageBonus },
    { candidates: ['Build'], value: String(derived.build) },
    { candidates: ['Move', 'MOV', 'Move Rate'], value: String(derived.move) },
    { candidates: ['Spending Level'], value: formatDollars(fin.spendingLevel) },
    { candidates: ['Cash'], value: formatDollars(fin.cash) },
    { candidates: ['Assets'], value: fin.assetsNote ?? formatDollars(fin.assets) },
    { candidates: ['Ideology', 'Ideology Beliefs', 'Ideologie'], value: inv.backstory.ideology },
    { candidates: ['Significant People', 'SignificantPeople'], value: inv.backstory.significantPeople },
    { candidates: ['Meaningful Locations', 'MeaningfulLocations'], value: inv.backstory.meaningfulLocations },
    { candidates: ['Treasured Possessions', 'TreasuredPossessions'], value: inv.backstory.treasuredPossessions },
    { candidates: ['Traits', 'Personal Description'], value: inv.backstory.traits },
    { candidates: ['Gear and Possessions', 'Gear', 'Equipment'], value: inv.gear.join(', ') },
  ]

  for (const name of CHARACTERISTIC_NAMES) {
    targets.push({ candidates: [name], value: String(chars[name]) })
    targets.push({ candidates: [`${name} half`, `${name}2`], value: String(halfValue(chars[name])) })
    targets.push({ candidates: [`${name} fifth`, `${name}5`], value: String(fifthValue(chars[name])) })
  }

  targets.push(...skillTargets(inv))
  return targets.filter((t) => t.value !== '')
}

export async function dumpFieldNames(pdfBytes: ArrayBuffer): Promise<string[]> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  return doc
    .getForm()
    .getFields()
    .map((f) => `${f.getName()} (${f.constructor.name})`)
}

export async function fillOfficialSheet(
  pdfBytes: ArrayBuffer,
  inv: Investigator,
): Promise<{ bytes: Uint8Array; report: FillReport }> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const form = doc.getForm()
  const fields = form.getFields()

  const byNormalized = new Map<string, PDFTextField>()
  for (const field of fields) {
    if (field instanceof PDFTextField) {
      byNormalized.set(normalize(field.getName()), field)
    }
  }

  const report: FillReport = { filled: 0, matched: [], unmatchedFields: [] }
  const used = new Set<string>()

  for (const target of buildTargets(inv)) {
    for (const candidate of target.candidates) {
      const key = normalize(candidate)
      const field = byNormalized.get(key)
      if (field && !used.has(key)) {
        try {
          field.setText(target.value)
          used.add(key)
          report.filled++
          report.matched.push({ field: field.getName(), value: target.value })
        } catch {
          // Field exists but rejects the value (e.g. maxLength); skip it.
        }
        break
      }
    }
  }

  for (const field of fields) {
    if (field instanceof PDFCheckBox) continue
    if (field instanceof PDFTextField && !used.has(normalize(field.getName()))) {
      report.unmatchedFields.push(field.getName())
    }
  }

  const bytes = await doc.save()
  return { bytes, report }
}
