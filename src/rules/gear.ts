export interface GearItem {
  name: string
  /** Approximate 1920s US price, formatted, e.g. "$2.00". */
  price?: string
}

export interface GearCategory {
  name: string
  items: readonly GearItem[]
}

/**
 * 1920s equipment catalog in the spirit of the Investigator Handbook's price
 * guide, grouped by category and alphabetized within each. Prices are
 * approximate era prices written from rules knowledge — spot-check against
 * the book and adjust here.
 */
export const GEAR_CATALOG_1920S: readonly GearCategory[] = [
  {
    name: 'Detective & Investigation',
    items: [
      { name: 'Fingerprint kit', price: '$10.00' },
      { name: 'Handcuffs', price: '$4.00' },
      { name: 'Lockpicks', price: '$5.00' },
      { name: 'Magnifying glass', price: '$1.50' },
      { name: 'Newspaper clippings file' },
      { name: 'Wire recorder (bulky)', price: '$150.00' },
    ],
  },
  {
    name: 'Lighting',
    items: [
      { name: 'Candles (dozen)', price: '$0.20' },
      { name: 'Carbide lamp', price: '$3.00' },
      { name: 'Flashlight', price: '$2.00' },
      { name: 'Kerosene lantern', price: '$1.50' },
      { name: 'Matches (box)', price: '$0.05' },
      { name: 'Spare batteries', price: '$0.40' },
    ],
  },
  {
    name: 'Photography & Optics',
    items: [
      { name: 'Binoculars', price: '$15.00' },
      { name: 'Folding camera (Kodak)', price: '$20.00' },
      { name: 'Kodak Brownie camera', price: '$2.75' },
      { name: 'Opera glasses', price: '$5.00' },
      { name: 'Roll of film', price: '$0.50' },
      { name: 'Telescope (small)', price: '$12.00' },
    ],
  },
  {
    name: 'Medical',
    items: [
      { name: 'Doctor’s bag (instruments & drugs)', price: '$40.00' },
      { name: 'First aid kit', price: '$2.50' },
      { name: 'Hip flask of brandy (medicinal)', price: '$2.00' },
      { name: 'Smelling salts', price: '$0.25' },
      { name: 'Surgical kit', price: '$25.00' },
    ],
  },
  {
    name: 'Tools',
    items: [
      { name: 'Axe', price: '$2.50' },
      { name: 'Bolt cutters', price: '$3.50' },
      { name: 'Crowbar', price: '$1.00' },
      { name: 'Hand drill', price: '$2.00' },
      { name: 'Hatchet', price: '$1.25' },
      { name: 'Padlock and chain', price: '$1.50' },
      { name: 'Rope (50 ft)', price: '$1.00' },
      { name: 'Shovel', price: '$1.50' },
      { name: 'Tool kit (general)', price: '$5.00' },
    ],
  },
  {
    name: 'Firearms',
    items: [
      { name: '.22 revolver', price: '$10.00' },
      { name: '.30 hunting rifle', price: '$25.00' },
      { name: '.38 revolver', price: '$15.00' },
      { name: '.45 automatic pistol', price: '$32.00' },
      { name: '12-gauge shotgun (double-barrel)', price: '$40.00' },
      { name: 'Ammunition (box of 50 rounds)', price: '$2.00' },
      { name: 'Gun cleaning kit', price: '$1.50' },
      { name: 'Shotgun shells (box of 25)', price: '$1.25' },
      { name: 'Thompson submachine gun', price: '$200.00' },
    ],
  },
  {
    name: 'Other Weapons',
    items: [
      { name: 'Blackjack', price: '$1.00' },
      { name: 'Brass knuckles', price: '$1.00' },
      { name: 'Hunting knife', price: '$2.50' },
      { name: 'Pocket knife', price: '$0.75' },
      { name: 'Sword cane', price: '$8.00' },
      { name: 'Walking stick (heavy)', price: '$2.00' },
    ],
  },
  {
    name: 'Outdoors & Travel',
    items: [
      { name: 'Canteen', price: '$1.00' },
      { name: 'Compass', price: '$2.00' },
      { name: 'Fishing kit', price: '$3.00' },
      { name: 'Knapsack', price: '$2.00' },
      { name: 'Road map', price: '$0.30' },
      { name: 'Sleeping bag / bedroll', price: '$4.00' },
      { name: 'Suitcase', price: '$7.00' },
      { name: 'Tent (two-man)', price: '$12.00' },
      { name: 'Tinned rations (week)', price: '$3.00' },
    ],
  },
  {
    name: 'Clothing',
    items: [
      { name: 'Evening wear', price: '$60.00' },
      { name: 'Fedora / cloche hat', price: '$3.00' },
      { name: 'Leather gloves', price: '$2.50' },
      { name: 'Overcoat', price: '$20.00' },
      { name: 'Raincoat', price: '$9.00' },
      { name: 'Stout boots', price: '$6.00' },
      { name: 'Three-piece suit', price: '$30.00' },
      { name: 'Work clothes', price: '$5.00' },
    ],
  },
  {
    name: 'Writing & Documents',
    items: [
      { name: 'Fountain pen', price: '$3.00' },
      { name: 'Journal (leather-bound)', price: '$2.00' },
      { name: 'Notebook and pencil', price: '$0.25' },
      { name: 'Portable typewriter', price: '$50.00' },
      { name: 'Stationery and stamps', price: '$0.50' },
    ],
  },
  {
    name: 'Sundries',
    items: [
      { name: 'Chalk', price: '$0.05' },
      { name: 'Cigarette case and lighter', price: '$3.00' },
      { name: 'Hand mirror', price: '$0.50' },
      { name: 'Hip flask', price: '$1.50' },
      { name: 'Playing cards', price: '$0.25' },
      { name: 'Pocket watch', price: '$5.00' },
      { name: 'Sewing kit', price: '$0.50' },
      { name: 'Whistle', price: '$0.25' },
    ],
  },
]

/** Label used when adding an item to the investigator's gear list. */
export function gearLabel(item: GearItem): string {
  return item.price ? `${item.name} (${item.price})` : item.name
}
