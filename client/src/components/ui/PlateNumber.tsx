export default function PlateNumber({
  plate,
  className = '',
}: {
  plate: string | null
  className?: string
}) {
  if (!plate) {
    return (
      <span className={`font-mono italic text-text-muted ${className}`}>
        Unidentified
      </span>
    )
  }
  return (
    <span className={`font-mono font-bold text-text-primary tracking-wide ${className}`}>
      {plate}
    </span>
  )
}
