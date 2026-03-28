'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { formatNumber, formatDate } from '@/lib/dateUtils'

interface Props {
  campaignName: string
  impressions: number
  clicks: number
  ctr: number
  muslimReach: number
  networkAvgCtr: number
  startDate: string
  clientName: string
  isLoading: boolean
}

function buildMessage(
  campaignName: string,
  impressions: number,
  ctr: number,
  muslimReach: number,
  networkAvgCtr: number,
  startDate: string,
): string {
  const parts: string[] = []

  // Opener
  parts.push(`As-salamu alaykum! Your ${campaignName} campaign is live and delivering results.`)

  // Performance line
  if (ctr >= networkAvgCtr * 2) {
    const multiplier = Math.round(ctr / networkAvgCtr)
    parts.push(
      `You're performing at ${ctr.toFixed(2)}% CTR — that's ${multiplier}x above our network average. Your ads are resonating strongly with the Muslim audience.`,
    )
  } else if (ctr >= networkAvgCtr) {
    parts.push(
      `Your campaign is performing at ${ctr.toFixed(2)}% CTR, right in line with our network average. Solid and consistent delivery.`,
    )
  } else {
    parts.push(
      `Your campaign has delivered ${formatNumber(impressions)} impressions so far, reaching an estimated ${formatNumber(muslimReach)} Muslims across our network.`,
    )
  }

  // Reach line
  parts.push(
    `You've reached an estimated ${formatNumber(muslimReach)} Muslims since ${formatDate(startDate)}.`,
  )

  // Upsell line
  if (impressions > 500_000) {
    parts.push(
      `Your brand is gaining strong visibility. Adding more impressions now would compound this momentum significantly.`,
    )
  } else if (impressions > 100_000) {
    parts.push(
      `You're building great reach. Scaling up your impressions would accelerate results across our premium Muslim inventory.`,
    )
  } else {
    parts.push(
      `Your campaign is just getting started. Consider boosting your impressions to reach more of your target audience faster.`,
    )
  }

  return parts.join(' ')
}

export default function CampaignSuccessBox({
  campaignName,
  impressions,
  clicks,
  ctr,
  muslimReach,
  networkAvgCtr,
  startDate,
  clientName,
  isLoading,
}: Props) {
  // suppress unused warning for clicks/clientName — kept in props for future use
  void clicks
  void clientName

  const mailtoSubject = encodeURIComponent(`Add More Impressions — ${campaignName}`)

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-xl"
        style={{
          borderLeft: '4px solid #1a4a2e',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Skeleton style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton style={{ height: 10, borderRadius: 5, width: 180 }} />
            <Skeleton style={{ height: 13, borderRadius: 5, width: '100%' }} />
            <Skeleton style={{ height: 13, borderRadius: 5, width: '88%' }} />
            <Skeleton style={{ height: 13, borderRadius: 5, width: '75%' }} />
          </div>
        </div>
      </div>
    )
  }

  const message = buildMessage(campaignName, impressions, ctr, muslimReach, networkAvgCtr, startDate)

  return (
    <div
      className="bg-white rounded-xl"
      style={{
        borderLeft: '4px solid #1a4a2e',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        padding: '20px 24px',
      }}
    >
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Left: avatar + message */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
          {/* Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center text-white font-bold"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#1a4a2e',
              fontSize: 13,
              letterSpacing: '0.02em',
            }}
          >
            SM
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              Nadia — Campaign Success Manager
            </p>
            <p style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.65 }}>
              {message}
            </p>
          </div>
        </div>

        {/* Right: CTA */}
        <div
          className="flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-1.5 flex-shrink-0"
        >
          <p
            className="hidden sm:block"
            style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}
          >
            Ready to scale?
          </p>
          <a
            href={`mailto:sales@muslimadnetwork.com?subject=${mailtoSubject}`}
            className="font-bold text-white rounded-full transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{
              backgroundColor: '#1a4a2e',
              padding: '10px 20px',
              fontSize: 13,
              display: 'inline-block',
            }}
          >
            Add More Impressions
          </a>
          <p
            className="hidden sm:block"
            style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}
          >
            Reply within 24 hours
          </p>
        </div>
      </div>
    </div>
  )
}
