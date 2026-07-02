import { rollDie, type Rng, defaultRng } from './dice'

/**
 * Short inspiration prompts for backstory entries (our own wording,
 * in the spirit of the 7e random backstory tables).
 */
export const BACKSTORY_TABLES = {
  ideology: [
    'Devout believer in an organized faith',
    'Convinced rationalist — science explains everything',
    'Superstitious; trusts omens, charms and gut feelings',
    'Committed to a political cause or party',
    'Money is what matters; everything has a price',
    'Idealist and social reformer, out to fix the world',
    'Hedonist — live fast, enjoy every day',
    'Fatalist; what will happen will happen',
    'Loyal above all to family and community',
    'Seeker after hidden truths and forbidden knowledge',
  ],
  significantPeople: [
    'A parent who shaped who you are',
    'A grandparent who raised you',
    'A sibling you would do anything for',
    'Your child — or a child in your care',
    'A partner or sweetheart, present or lost',
    'The teacher or mentor who set you on your path',
    'A childhood friend who knows all your secrets',
    'A famous figure you admire from afar',
    'A rival who drives you to be better',
    'Someone you wronged and hope to make amends to',
  ],
  meaningfulLocations: [
    'The house where you grew up',
    'The place you first fell in love',
    'A quiet spot for thinking, away from everyone',
    'The graveside of someone dear',
    'Your family home, still standing or long gone',
    'A club, bar or salon where you truly belong',
    'Your alma mater — school or university',
    'A far-off place visited once and never forgotten',
    'Your library, study or workshop',
    'A place connected to your deepest fear',
  ],
  treasuredPossessions: [
    'An item connected to your finest hour',
    'A keepsake from a departed loved one',
    'A photograph you always carry',
    'An heirloom passed down through the family',
    'A trusty tool of your trade',
    'A well-thumbed book that changed your life',
    'A letter you have read a hundred times',
    'A musical instrument you play to calm your nerves',
    'A weapon kept close, just in case',
    'A pet, or the memento of one',
  ],
  traits: [
    'Generous to a fault',
    'Hardened — little shocks you anymore',
    'A dreamer with your head in the clouds',
    'Meticulous and precise in all things',
    'A charming rogue with a quick smile',
    'Stubborn as a mule once your mind is set',
    'A dry, dark sense of humor',
    'Cautious; you plan before you leap',
    'Hot-tempered but quick to forgive',
    'Reliable — you keep your word, whatever it costs',
  ],
} as const

export type BackstoryTableKey = keyof typeof BACKSTORY_TABLES

export function rollBackstory(table: BackstoryTableKey, rng: Rng = defaultRng): string {
  const entries = BACKSTORY_TABLES[table]
  return entries[rollDie(entries.length, rng) - 1]
}

/** A few era-appropriate gear suggestions for the equipment step. */
export const GEAR_SUGGESTIONS_1920S: readonly string[] = [
  'Flashlight',
  'Matches and candles',
  'Notebook and pencil',
  'Pocket watch',
  'Camera (Kodak Brownie)',
  'Magnifying glass',
  'First aid kit',
  'Rope (50 ft)',
  'Crowbar',
  'Pocket knife',
  'Lockpicks',
  'Binoculars',
  'Map of the local area',
  'Hip flask',
  'Revolver (.38)',
  'Newspaper clippings file',
]
