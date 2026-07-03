/**
 * Original decorative vector art for the character sheet — drawn in code,
 * no external assets. Everything inherits `currentColor` so the ink tone
 * is controlled by CSS (and prints crisply).
 */

/** Art-deco corner ornament, drawn for the top-left; rotate for the others. */
export function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 90 90" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 86 V16 Q4 4 16 4 H86" />
        <path d="M12 86 V22 Q12 12 22 12 H86" strokeWidth="0.9" />
        {/* sunburst fan */}
        <path d="M20 20 L44 44" strokeWidth="0.9" />
        <path d="M24 14 L46 36" strokeWidth="0.9" />
        <path d="M14 24 L36 46" strokeWidth="0.9" />
        {/* stepped deco block */}
        <path d="M20 34 h8 v8 h-8 z" strokeWidth="1.1" />
      </g>
      <circle cx="24" cy="24" r="3.2" fill="currentColor" />
      <circle cx="48" cy="48" r="1.8" fill="currentColor" />
    </svg>
  )
}

/** Horizontal divider with a central occult star motif. */
export function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="ornament-divider" aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 60 18" className="divider-motif" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          {/* five-pointed star in a lens */}
          <path d="M30 2 L33 7.5 L39 8 L34.5 12 L36 17.5 L30 14 L24 17.5 L25.5 12 L21 8 L27 7.5 Z" />
          <ellipse cx="30" cy="9.5" rx="26" ry="7" strokeWidth="0.7" />
        </g>
        <circle cx="30" cy="9.8" r="1.6" fill="currentColor" />
        <circle cx="4" cy="9.5" r="1.1" fill="currentColor" />
        <circle cx="56" cy="9.5" r="1.1" fill="currentColor" />
      </svg>
      {label && <span className="divider-label">{label}</span>}
    </div>
  )
}

/** Circular sigil flanking the sheet title: a warded star ringed by tentacles. */
export function HeaderEmblem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <circle cx="36" cy="36" r="32" strokeWidth="1.6" />
        <circle cx="36" cy="36" r="27" strokeWidth="0.8" />
        {/* tentacle ring: eight curled hooks around the rim */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4
          const x = 36 + 29.5 * Math.cos(a)
          const y = 36 + 29.5 * Math.sin(a)
          const r = ((i * 45 + 90) % 360).toFixed(0)
          return (
            <path
              key={i}
              d="M0 0 q 3 -4 1.2 -7.5 q -1 -2.2 -3.2 -2.4"
              strokeWidth="1.1"
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r})`}
            />
          )
        })}
        {/* central star with watchful eye */}
        <path d="M36 14 L41.2 29.2 L57 29.6 L44.4 39.2 L49 54.5 L36 45.4 L23 54.5 L27.6 39.2 L15 29.6 L30.8 29.2 Z" strokeWidth="1.4" />
        <ellipse cx="36" cy="36" rx="7.5" ry="4.6" strokeWidth="1.1" />
      </g>
      <circle cx="36" cy="36" r="2.2" fill="currentColor" />
    </svg>
  )
}

/**
 * Curling tentacles rising along a baseline — anchors the foot of page 2.
 * Filled, tapered shapes (a stroked centerline reads as squiggles at print size).
 */
export function TentacleFlourish({ className }: { className?: string }) {
  const sucker = (x: number, y: number, r: number) => (
    <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#f8f0da" opacity="0.85" />
  )
  return (
    <svg className={className} viewBox="0 0 320 84" aria-hidden="true">
      <g fill="currentColor">
        {/* left large tentacle: wide base, S-curve, spiral tip */}
        <path d="M30 80 C 28 58 40 44 54 33 C 64 25 68 18 63 13 C 58 8.5 50 11 50 17 C 50 21.5 55 23 57 20 L 59.5 22 C 56 27.5 47 26 46.5 18.5 C 46 9.5 58 4.5 66 10 C 74 16 71 27 60 36 C 48 46 44 58 46 80 Z" />
        {/* middle small tentacle leaning right */}
        <path d="M140 80 C 142 64 152 56 160 48 C 166 42 167 36 162.5 33 C 158.5 30.5 153.5 33 154.5 37.5 L 151.5 38.5 C 149.5 31.5 157.5 26.5 164 30.5 C 170.5 34.5 169.5 43 161.5 51 C 154 58.5 151 66 151.5 80 Z" />
        {/* right large tentacle mirroring left */}
        <path d="M290 80 C 292 58 280 44 266 33 C 256 25 252 18 257 13 C 262 8.5 270 11 270 17 C 270 21.5 265 23 263 20 L 260.5 22 C 264 27.5 273 26 273.5 18.5 C 274 9.5 262 4.5 254 10 C 246 16 249 27 260 36 C 272 46 276 58 274 80 Z" />
        {/* tiny distant tentacle */}
        <path d="M210 80 C 211 70 216 65 220 60 C 223 56 223 52.5 220.5 51 C 218 49.5 215 51.5 216 54 L 213.5 55 C 212 50 217.5 46.5 221.5 49.5 C 225.5 52.5 224.5 58 219.5 63 C 215.5 67 214 72 214.5 80 Z" />
      </g>
      {/* suckers punched out of the fill */}
      {sucker(45, 60, 2)}
      {sucker(50, 48, 1.8)}
      {sucker(56, 38, 1.5)}
      {sucker(152, 62, 1.4)}
      {sucker(157, 52, 1.2)}
      {sucker(275, 60, 2)}
      {sucker(270, 48, 1.8)}
      {sucker(264, 38, 1.5)}
      <path d="M8 80.5 H 312" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="8" cy="80.5" r="1.6" fill="currentColor" />
      <circle cx="312" cy="80.5" r="1.6" fill="currentColor" />
    </svg>
  )
}

/** Faint ring left by a coffee cup. */
export function CoffeeRing({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke="#6b4a2f">
        <path d="M60 8 A52 52 0 1 1 59 8.01" strokeWidth="7" opacity="0.16" strokeDasharray="150 22 60 14" />
        <path d="M60 16 A44 44 0 1 0 61 16.01" strokeWidth="2.4" opacity="0.2" strokeDasharray="80 30 120 18" />
      </g>
    </svg>
  )
}

/** Small ink blot with splatter. */
export function InkBlot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
      <g fill="#2a2419" opacity="0.14">
        <path d="M28 22 Q 36 14 42 22 Q 50 28 44 36 Q 46 44 36 44 Q 28 50 24 42 Q 14 40 18 31 Q 18 24 28 22 Z" />
        <circle cx="49" cy="18" r="2.4" />
        <circle cx="14" cy="44" r="1.7" />
        <circle cx="46" cy="46" r="1.2" />
        <circle cx="10" cy="22" r="1" />
      </g>
    </svg>
  )
}
