'use client'

interface Props {
  score: number
  label: string
  isImpersonating?: boolean
  isHidden?: boolean
  onVisibilityToggle?: () => void
}

const LABEL_COLORS: Record<string, { badge: string; text: string }> = {
  'Excellent':       { badge: '#d1fae5', text: '#065f46' },
  'Good':            { badge: '#dbeafe', text: '#1e40af' },
  'On Track':        { badge: '#fef3c7', text: '#92400e' },
  'Needs Attention': { badge: '#fee2e2', text: '#991b1b' },
}

const InfoTooltip = () => (
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
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 text-xs text-white rounded-lg
                 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 leading-relaxed"
      style={{ backgroundColor: '#1e293b' }}
    >
      Score 0–100: Base 50 + CTR vs. network avg (up to 25 pts) + delivery pacing (up to 25 pts).
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
        style={{ borderTopColor: '#1e293b' }}
      />
    </div>
  </div>
)

const HeartPulseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)

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

export default function CampaignHealthScore({ score, label, isImpersonating, isHidden, onVisibilityToggle }: Props) {
  if (!isImpersonating && isHidden) return null

  const colors = LABEL_COLORS[label] ?? LABEL_COLORS['On Track']

  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col relative"
      style={{
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        borderTop: '3px solid #C9A84C',
        transition: 'box-shadow 150ms ease, opacity 200ms ease',
        opacity: isHidden ? 0.3 : 1,
      }}
      onMouseEnter={e => {
        if (!isHidden) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(201,168,76,0.15)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
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
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #F0D080)' }}
      >
        <span style={{ color: '#fff', display: 'flex' }}><HeartPulseIcon /></span>
      </div>
      <div className="flex items-center gap-1 mb-1">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Campaign Health</p>
        <InfoTooltip />
      </div>
      <p className="text-2xl font-semibold text-gray-900">
        {score}
        <span className="text-sm font-normal text-[#94a3b8] ml-1">/ 100</span>
      </p>
      <span
        className="mt-2 text-xs font-semibold px-3 py-1 rounded-full self-start"
        style={{ backgroundColor: colors.badge, color: colors.text }}
      >
        {label}
      </span>
    </div>
  )
}
