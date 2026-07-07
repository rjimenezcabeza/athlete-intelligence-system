'use client'

interface MacroPieChartProps {
  proteinG: number
  carbsG: number
  fatG: number
  accentColor?: string
  size?: number
}

export function MacroPieChart({ proteinG, carbsG, fatG, accentColor = '#C8FF00', size = 80 }: MacroPieChartProps) {
  const protKcal = proteinG * 4
  const carbKcal = carbsG * 4
  const fatKcal = fatG * 9
  const total = protKcal + carbKcal + fatKcal

  if (total === 0) return null

  const COLORS = { prot: '#60A5FA', carb: accentColor, fat: '#F97316' }
  const segments = [
    { value: protKcal, color: COLORS.prot, label: 'P', g: proteinG },
    { value: carbKcal, color: COLORS.carb, label: 'C', g: carbsG },
    { value: fatKcal, color: COLORS.fat, label: 'F', g: fatG },
  ].filter(s => s.value > 0)

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 6
  const innerR = r - 10

  let startAngle = -Math.PI / 2

  const paths = segments.map(seg => {
    const fraction = seg.value / total
    const angle = fraction * 2 * Math.PI
    const endAngle = startAngle + angle

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const xi1 = cx + innerR * Math.cos(endAngle)
    const yi1 = cy + innerR * Math.sin(endAngle)
    const xi2 = cx + innerR * Math.cos(startAngle)
    const yi2 = cy + innerR * Math.sin(startAngle)

    const largeArc = angle > Math.PI ? 1 : 0

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      'Z',
    ].join(' ')

    startAngle = endAngle
    return { d, color: seg.color, fraction, label: seg.label, g: seg.g }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} opacity={0.9} />
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#888', fontFamily: 'DM Mono, monospace' }}>
              {seg.label} <span style={{ color: seg.color }}>{seg.g}g</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
