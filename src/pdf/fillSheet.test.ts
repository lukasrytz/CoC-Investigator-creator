import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { dumpFieldNames, fillOfficialSheet } from './fillSheet'
import { emptyInvestigator } from '../rules/types'

/** Build a small fillable PDF with field names in the style of official sheets. */
async function makeTestPdf(fieldNames: string[]): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([600, 800])
  const form = doc.getForm()
  fieldNames.forEach((name, i) => {
    const field = form.createTextField(name)
    field.addToPage(page, { x: 40, y: 760 - i * 24, width: 200, height: 18 })
  })
  const bytes = await doc.save()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function sampleInvestigator() {
  const inv = emptyInvestigator()
  inv.name = 'Nora Blake'
  inv.age = 42
  inv.occupationId = 'journalist'
  inv.luck = 45
  inv.characteristics = { STR: 45, CON: 55, SIZ: 60, DEX: 65, APP: 45, INT: 60, POW: 65, EDU: 70 }
  inv.skills = [
    { skillId: 'spot-hidden', occupationPoints: 30, personalPoints: 0 },
    { skillId: 'credit-rating', occupationPoints: 20, personalPoints: 0 },
  ]
  inv.backstory.ideology = 'Science explains everything.'
  inv.gear = ['Flashlight', 'Press pass']
  return inv
}

describe('official PDF filling', () => {
  it('fills fields matched by normalized name', async () => {
    const pdf = await makeTestPdf([
      'Investigators_Name',
      'Occupation',
      'Age',
      'STR',
      'STR_half',
      'STR_fifth',
      'Spot_Hidden',
      'CreditRating',
      'HP',
      'Ideology',
      'Gear',
      'Completely_Unrelated_Field',
    ])
    const inv = sampleInvestigator()
    const { bytes, report } = await fillOfficialSheet(pdf, inv)

    expect(report.filled).toBe(11)
    expect(report.unmatchedFields).toEqual(['Completely_Unrelated_Field'])

    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    const reloaded = await PDFDocument.load(ab)
    const form = reloaded.getForm()
    expect(form.getTextField('Investigators_Name').getText()).toBe('Nora Blake')
    expect(form.getTextField('Occupation').getText()).toBe('Journalist')
    expect(form.getTextField('Age').getText()).toBe('42')
    expect(form.getTextField('STR').getText()).toBe('45')
    expect(form.getTextField('STR_half').getText()).toBe('22')
    expect(form.getTextField('STR_fifth').getText()).toBe('9')
    expect(form.getTextField('Spot_Hidden').getText()).toBe('55') // base 25 + 30
    expect(form.getTextField('CreditRating').getText()).toBe('20')
    expect(form.getTextField('HP').getText()).toBe('11')
    expect(form.getTextField('Ideology').getText()).toBe('Science explains everything.')
    expect(form.getTextField('Gear').getText()).toBe('Flashlight, Press pass')
  })

  it('dumps field names with their types', async () => {
    const pdf = await makeTestPdf(['Name', 'STR'])
    const names = await dumpFieldNames(pdf)
    expect(names).toHaveLength(2)
    expect(names[0]).toContain('Name')
    expect(names[0]).toContain('PDFTextField')
  })
})
