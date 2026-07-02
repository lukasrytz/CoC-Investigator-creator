# Call of Cthulhu 7e — Investigator Creator

A browser-based investigator (character) creator for **Call of Cthulhu, 7th Edition** (classic 1920s era).
Purely client-side — no backend, no accounts; your in-progress investigator autosaves to the browser's
localStorage.

## Features

- **Guided 8-step wizard**: basics → characteristics → occupation → occupation skills → personal
  interests → backstory → gear & finances → review.
- **Three characteristic methods**: roll dice per the rules (3D6×5 / (2D6+6)×5, with optional
  swapping of rolled values), the optional 460-point buy, or manual entry.
- **Full age modifiers**: bracket deductions, automatic EDU improvement checks, teen Luck
  (roll twice, keep best), MOV penalties — with each adjustment shown.
- **Live derived stats**: HP, MP, Sanity, Luck, damage bonus, build and MOV update as you type.
- **28 core occupations** with skill point formulas, credit rating ranges and skill slots
  (fixed skills, "choice of N" groups, free picks) — allocations are validated as you spend.
- **Backstory prompts**: dice buttons for ideology, significant people, locations, possessions and
  traits, plus key-connection selection.
- **1920s finances** computed from Credit Rating (standard of living, spending level, cash, assets).
- **Output**: a print-friendly character sheet (use the browser's print-to-PDF), or fill your own
  downloaded copy of the official fillable PDF sheet directly in the browser.

## Development

```sh
npm install
npm run dev      # start the dev server
npm test         # run the rules-engine and PDF unit tests
npm run build    # typecheck and build for production (static site in dist/)
```

The rules engine lives in `src/rules/` as pure TypeScript with no React dependencies, so every
formula (dice, age brackets, damage bonus table, point pools, finances) is unit-tested in isolation.

## Filling the official PDF sheet

This app does **not** bundle Chaosium's character sheet. Download the free fillable 1920s
investigator sheet from Chaosium yourself, then select it on the *Review & Output* step. Field names
differ between releases of the sheet, so matching is heuristic (normalized-name lookup with several
candidates per value); the fill report shows what matched, and *List field names* exports the PDF's
field names so the mapping in `src/pdf/fillSheet.ts` can be extended.

## Legal

This is an unofficial fan tool. Call of Cthulhu is a trademark of Chaosium Inc. This project
contains no rulebook text; game mechanics are not copyrightable and the essential creation rules are
published in Chaosium's free Quick-Start.
