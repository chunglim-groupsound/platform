interface AvatarProps {
  name: string
  src?: string | null
  size?: number
  bg?: string
  className?: string
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const BG_PALETTE = [
  '#3B5998', '#E05560', '#9C7FDB', '#4FBF7A', '#F59E0B',
  '#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F97316',
]

function colorFromName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return BG_PALETTE[Math.abs(hash) % BG_PALETTE.length]
}

export function Avatar({ name, src, size = 36, bg, className = '' }: AvatarProps) {
  const bg_ = bg ?? colorFromName(name)

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: bg_,
        fontSize: Math.round(size * 0.38),
      }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  )
}
