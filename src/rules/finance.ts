/** 1920s wealth from Credit Rating (US dollars). */
export interface Finances {
  label: string
  spendingLevel: number
  cash: number
  assets: number
  assetsNote?: string
}

export function finances1920s(creditRating: number): Finances {
  const cr = Math.max(0, Math.floor(creditRating))
  if (cr === 0) {
    return { label: 'Penniless', spendingLevel: 0.5, cash: 0.5, assets: 0, assetsNote: 'none' }
  }
  if (cr <= 9) {
    return { label: 'Poor', spendingLevel: 2, cash: cr, assets: cr * 10 }
  }
  if (cr <= 49) {
    return { label: 'Average', spendingLevel: 10, cash: cr * 2, assets: cr * 50 }
  }
  if (cr <= 89) {
    return { label: 'Wealthy', spendingLevel: 50, cash: cr * 5, assets: cr * 500 }
  }
  if (cr <= 98) {
    return { label: 'Rich', spendingLevel: 250, cash: cr * 20, assets: cr * 2000 }
  }
  return {
    label: 'Super Rich',
    spendingLevel: 5000,
    cash: 50000,
    assets: 5000000,
    assetsNote: '$5M or more',
  }
}

export function formatDollars(amount: number): string {
  const fractionDigits = Number.isInteger(amount) && amount >= 1 ? 0 : 2
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`
}
