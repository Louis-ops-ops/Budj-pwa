import styles from './AllocationBar.module.css'

/**
 * Repartition bar (Figma: Carte budget › Répartition, Budget réparti › Barre).
 * Real widths, not Figma's hard-stop gradient (v3 §2).
 */
export function AllocationBar({
  segments,
  total,
  label
}: {
  segments: { key: string; value: number; color: string }[]
  total: number
  label: string
}): React.JSX.Element {
  const scale = Math.max(total, segments.reduce((a, s) => a + s.value, 0))
  return (
    <div className={styles.bar} role="img" aria-label={label}>
      {scale > 0 &&
        segments.map((s) => (
          <span
            key={s.key}
            className={styles.segment}
            style={{ flexBasis: `${(Math.max(0, s.value) / scale) * 100}%`, background: s.color }}
          />
        ))}
    </div>
  )
}
