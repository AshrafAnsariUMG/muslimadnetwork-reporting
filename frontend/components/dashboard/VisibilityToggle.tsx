'use client'

interface Props {
  isHidden: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
}

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function VisibilityToggle({ isHidden, onToggle, size = 'sm' }: Props) {
  const isImpersonating = typeof window !== 'undefined' && !!localStorage.getItem('impersonation_token')
  if (!isImpersonating) return null

  const tooltip = isHidden ? 'Show to client' : 'Hide from client'

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      title={tooltip}
      className="inline-flex items-center justify-center rounded-full transition-all duration-150 flex-shrink-0"
      style={{
        width: size === 'sm' ? 24 : 28,
        height: size === 'sm' ? 24 : 28,
        backgroundColor: isHidden ? '#fee2e2' : '#f1f5f9',
        color: isHidden ? '#dc2626' : '#94a3b8',
      }}
    >
      {isHidden ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  )
}
