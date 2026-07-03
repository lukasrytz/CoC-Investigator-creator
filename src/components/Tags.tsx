import type { EntryTag } from '../rules/types'

const LABELS: Record<EntryTag, string> = {
  modern: 'Modern',
  classic: 'Classic',
  uncommon: 'Uncommon',
}

/** Era/rarity tags rendered like the rulebooks: "Computer Use [Modern]". */
export default function Tags({ tags }: { tags?: readonly EntryTag[] }) {
  if (!tags?.length) return null
  return (
    <>
      {tags.map((tag) => (
        <span key={tag} className={`tag tag-${tag}`}>
          [{LABELS[tag]}]
        </span>
      ))}
    </>
  )
}
