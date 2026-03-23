'use client'

import { Campaign } from '@/types/reports'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:   { bg: '#d1fae5', text: '#065f46' },
  paused:   { bg: '#fef3c7', text: '#92400e' },
  ended:    { bg: '#f1f5f9', text: '#475569' },
  upcoming: { bg: '#dbeafe', text: '#1e40af' },
}

interface Props {
  campaigns: Campaign[]
  activeCampaign: Campaign
  clientType: string
  onSwitch: (campaign: Campaign) => void
}

export default function CampaignSwitcher({ campaigns, activeCampaign, clientType, onSwitch }: Props) {
  if (clientType !== 'multi_campaign' || campaigns.length <= 1) return null

  return (
    <div className="relative">
      {/* Scrollable pill row */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {campaigns.map((campaign) => {
          const isActive = campaign.id === activeCampaign.id
          const statusColor = STATUS_COLORS[campaign.status] ?? STATUS_COLORS.ended

          return (
            <button
              key={campaign.id}
              onClick={() => onSwitch(campaign)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-150"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #1a4a2e, #2d7a4a)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: 'inset 3px 0 0 #C9A84C, 0 2px 10px rgba(26,74,46,0.25)',
                    }
                  : {
                      backgroundColor: '#ffffff',
                      color: '#64748b',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.border = '1px solid #C9A84C'
                  el.style.transform = 'scale(1.02)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.border = '1px solid #e5e7eb'
                  el.style.transform = 'scale(1)'
                }
              }}
            >
              <span>{campaign.name}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                style={
                  isActive
                    ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { backgroundColor: statusColor.bg, color: statusColor.text }
                }
              >
                {campaign.status}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
