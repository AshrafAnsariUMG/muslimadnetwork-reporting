import BenchmarkBadge from './BenchmarkBadge'

interface StatCardProps {
  label: string
  value: string
  subLabel?: string
  icon?: React.ReactNode
  iconBg?: string
  ctrVsBenchmark?: number
  infoTooltip?: string
  isImpersonating?: boolean
  isHidden?: boolean
  onVisibilityToggle?: () => void
}

const EyeOffIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const EyeOnIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="relative group inline-flex items-center">
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-[#94a3b8] cursor-help"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 text-xs text-white rounded-lg
                 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 leading-relaxed"
      style={{ backgroundColor: '#1e293b' }}
    >
      {text}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
        style={{ borderTopColor: '#1e293b' }}
      />
    </div>
  </div>
)

export default function StatCard({
  label, value, subLabel, icon, iconBg, ctrVsBenchmark, infoTooltip,
  isImpersonating, isHidden, onVisibilityToggle,
}: StatCardProps) {
  if (!isImpersonating && isHidden) return null

  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col relative"
      style={{
        border: '1px solid #C9A84C',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 200ms ease',
        opacity: isHidden ? 0.3 : 1,
      }}
      onMouseEnter={e => {
        if (isHidden) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      {isImpersonating && onVisibilityToggle && (
        <button
          onClick={onVisibilityToggle}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          title={isHidden ? 'Show card' : 'Hide card'}
        >
          {isHidden ? <EyeOffIcon /> : <EyeOnIcon />}
        </button>
      )}
      {icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: iconBg ?? '#f1f5f9' }}
        >
          <span style={{ display: 'flex' }}>{icon}</span>
        </div>
      )}
      <div className="flex items-center gap-1 mb-1">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">{label}</p>
        {infoTooltip && <InfoTooltip text={infoTooltip} />}
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {subLabel && <p className="text-xs text-[#64748b] mt-1 capitalize">{subLabel}</p>}
      {ctrVsBenchmark !== undefined && <BenchmarkBadge ctrVsBenchmark={ctrVsBenchmark} />}
    </div>
  )
}
