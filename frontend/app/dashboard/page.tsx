'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import RouteGuard from '@/components/layout/RouteGuard'
import { useAuth } from '@/context/AuthContext'
import { useReport } from '@/hooks/useReport'
import { useVisibility } from '@/hooks/useVisibility'
import { getDefaultDateRange, formatDate, formatNumber, formatCTR, formatConversions } from '@/lib/dateUtils'
import { Campaign, SummaryReport, DeviceRow, SiteBreakdown, CreativeRow, ConversionReport } from '@/types/reports'

import CampaignSwitcher from '@/components/dashboard/CampaignSwitcher'
import DateRangePicker from '@/components/dashboard/DateRangePicker'
import StatCard from '@/components/dashboard/StatCard'
import ConversionCard from '@/components/dashboard/ConversionCard'
import DeviceBreakdownChart from '@/components/dashboard/DeviceBreakdownChart'
import DomainBreakdownCards from '@/components/dashboard/DomainBreakdownCards'
import AppBreakdownCards from '@/components/dashboard/AppBreakdownCards'
import CreativeBreakdownGrid from '@/components/dashboard/CreativeBreakdownGrid'
import { useCreativeMetadata } from '@/hooks/useCreativeMetadata'
import IslamicDivider from '@/components/ui/IslamicDivider'
import VisibilityToggle from '@/components/dashboard/VisibilityToggle'
import OffersStack from '@/components/dashboard/OffersStack'
import MasjidConnectSection from '@/components/dashboard/MasjidConnectSection'
import { useOffers } from '@/hooks/useOffers'
import { useMasjidConnect } from '@/hooks/useMasjidConnect'
import { Skeleton } from '@/components/ui/Skeleton'
import StatCardSkeleton from '@/components/ui/StatCardSkeleton'
import { MosqueIcon } from '@/components/ui/IslamicIcons'
import api from '@/lib/api'

// ─── Icons ───────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const CursorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l14 9-7 1-4 7L5 3z" />
  </svg>
)

const PercentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
)


const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const MosqueStatIcon = () => <MosqueIcon size={20} color="#059669" />

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active:   { bg: '#d1fae5', text: '#065f46' },
  paused:   { bg: '#fef3c7', text: '#92400e' },
  ended:    { bg: '#f1f5f9', text: '#64748b' },
  upcoming: { bg: '#dbeafe', text: '#1e40af' },
}

// ─── Layout primitives ────────────────────────────────────────────────────────

// 8-pointed star icon for section headings
const SmallGoldStar = () => (
  <svg width="10" height="10" viewBox="-5.5 -5.5 11 11" style={{ flexShrink: 0 }}>
    <polygon
      points="0,-5 0.79,-1.91 3.54,-3.54 1.91,-0.79 5,0 1.91,0.79 3.54,3.54 0.79,1.91 0,5 -0.79,1.91 -3.54,3.54 -1.91,0.79 -5,0 -1.91,-0.79 -3.54,-3.54 -0.79,-1.91"
      fill="#C9A84C"
    />
  </svg>
)

function SectionHeading({ title, toggle }: { title: string; toggle?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-1.5">
        <SmallGoldStar />
        <h2
          className="text-sm font-bold text-gray-800 uppercase tracking-wide"
          style={{ borderBottom: '2px solid #C9A84C', paddingBottom: '2px' }}
        >
          {title}
        </h2>
      </div>
      {toggle}
    </div>
  )
}

function SectionCard({
  children,
  delay = 0,
  hidden,
  isImpersonating,
}: {
  children: React.ReactNode
  delay?: number
  hidden?: boolean
  isImpersonating?: boolean
}) {
  if (!isImpersonating && hidden) return null

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden fade-in-up"
      style={{
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        animationDelay: `${delay}ms`,
        opacity: hidden ? 0.4 : 1,
        transition: 'opacity 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={e => {
        if (!hidden) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
      }}
    >
      {children}
    </div>
  )
}

function SkeletonBlock({ height = 'h-20' }: { height?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded-xl w-full ${height}`} />
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-500 text-center">
      {message}
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

function DashboardContent() {
  const { user, logout, isImpersonating, stopImpersonation } = useAuth()

  const defaultRange = getDefaultDateRange()
  const [dateFrom, setDateFrom] = useState(defaultRange.date_from)
  const [dateTo, setDateTo] = useState(defaultRange.date_to)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignsLoading, setCampaignsLoading] = useState(true)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const client = user?.client
  useEffect(() => {
    api.get<Campaign[]>('/api/reports/campaigns')
      .then(({ data }) => {
        setCampaigns(data)
        const primary = data.find((c) => c.is_primary) ?? data[0] ?? null
        setSelectedCampaign(primary)
      })
      .catch(() => {})
      .finally(() => setCampaignsLoading(false))
  }, [])

  const campaignId = selectedCampaign?.id

  const summary    = useReport<SummaryReport>('summary', dateFrom, dateTo, campaignId)
  const device     = useReport<DeviceRow[]>('device', dateFrom, dateTo, campaignId)
  const site       = useReport<SiteBreakdown>('site', dateFrom, dateTo, campaignId)
  const creative   = useReport<CreativeRow[]>('creative', dateFrom, dateTo, campaignId)

  const { metadata: creativeMetadata, isLoading: creativeMetaLoading } =
    useCreativeMetadata(campaignId, client?.client_type)

  const conversionEnabled =
    (client?.client_type === 'conversion' || client?.client_type === 'multi_campaign') &&
    (selectedCampaign?.has_conversion_tracking ?? false)
  const conversionRaw = useReport<{ total_conversions: number; total_conversion_value: number }>(
    'conversion', dateFrom, dateTo, conversionEnabled ? campaignId : undefined,
  )
  const conversionData: ConversionReport = conversionEnabled && conversionRaw.data
    ? { available: true, ...conversionRaw.data }
    : { available: false }

  // Visibility
  const { isHidden, toggle } = useVisibility(client?.id)
  const { offers, dismissOffer } = useOffers()
  const { data: masjidData, isLoading: masjidLoading } = useMasjidConnect(campaignId)

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from)
    setDateTo(to)
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const statusBadge = selectedCampaign
    ? STATUS_STYLES[selectedCampaign.status] ?? STATUS_STYLES.ended
    : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>

      {/* Impersonation banner */}
      {isImpersonating && (
        <div
          className="flex items-center justify-between px-6 py-2.5 text-sm text-white"
          style={{ backgroundColor: '#dc2626' }}
        >
          <span>
            Viewing as <strong>{client?.name ?? 'client'}</strong> — impersonation mode.
            {' '}<span className="opacity-75 text-xs">Eye icons let you show/hide sections and rows.</span>
          </span>
          <button
            onClick={stopImpersonation}
            className="ml-4 px-4 py-1 bg-white text-xs font-semibold rounded-full"
            style={{ color: '#dc2626' }}
          >
            Exit Impersonation
          </button>
        </div>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <OffersStack offers={offers} onDismiss={dismissOffer} />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b-2" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            {client?.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="h-8 object-contain" />
            ) : (
              <span className="font-semibold text-sm" style={{ color: '#C9A84C' }}>{client?.name ?? 'Reporting Portal'}</span>
            )}
          </div>
          {/* Bismillah — decorative blessing, top center of header */}
          <span
            className="hidden sm:block select-none pointer-events-none"
            style={{ fontFamily: 'serif', opacity: 0.4, color: '#C9A84C', fontSize: '13px', letterSpacing: '0.5px' }}
            aria-hidden="true"
          >
            بسم الله الرحمن الرحيم
          </span>
          <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-gray-900 transition-colors"
            >
              <span className="hidden sm:block max-w-[140px] truncate">{user?.name}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl overflow-hidden z-20"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9' }}
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-[#64748b] truncate mt-0.5">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Change Password
                </Link>
                <div className="border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
                  style={{ color: '#dc2626' }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          </div>{/* end flex items-center gap-3 */}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 space-y-5">

        {/* Campaign title */}
        {campaignsLoading ? (
          <SkeletonBlock height="h-14" />
        ) : selectedCampaign ? (
          <div className="fade-in-up" style={{ animationDelay: '0ms' }}>
            <h1 className="text-xl font-bold text-gray-900">Campaign Performance</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-sm text-[#64748b]">{selectedCampaign.name}</span>
              {statusBadge && (
                <span
                  className="text-xs font-semibold px-3 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                >
                  {selectedCampaign.status}
                </span>
              )}
              <span className="text-xs text-gray-400">
                Started {formatDate(selectedCampaign.start_date)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[#64748b]">No campaigns found for your account.</div>
        )}

        {/* Campaign switcher — multi_campaign clients only */}
        {selectedCampaign && (
          <div className="fade-in-up" style={{ animationDelay: '50ms' }}>
            <CampaignSwitcher
              campaigns={campaigns}
              activeCampaign={selectedCampaign}
              clientType={client?.client_type ?? ''}
              onSwitch={setSelectedCampaign}
            />
          </div>
        )}

        {/* Date range picker */}
        <div className="fade-in-up" style={{ animationDelay: '100ms' }}>
          <DateRangePicker dateFrom={dateFrom} dateTo={dateTo} onDateChange={handleDateChange} />
        </div>

        {/* Summary stat cards */}
        {(isImpersonating || !isHidden('summary')) && (
          <div className="fade-in-up" style={{ animationDelay: '100ms' }}>
            {isImpersonating && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Summary</span>
                <VisibilityToggle
                  isHidden={isHidden('summary')}
                  onToggle={() => toggle('summary', 'section', null, !isHidden('summary'))}
                  size="md"
                />
              </div>
            )}
            <div style={{ opacity: isHidden('summary') ? 0.4 : 1, transition: 'opacity 200ms ease' }}>
              {summary.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
                </div>
              ) : summary.error ? (
                <ErrorBlock message="Summary data temporarily unavailable — please refresh." />
              ) : summary.data ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Impressions"
                    value={formatNumber(summary.data.impressions)}
                    icon={<EyeIcon />}
                    iconBg="#dbeafe"
                    isImpersonating={isImpersonating}
                    isHidden={isHidden('stat_impressions')}
                    onVisibilityToggle={() => toggle('stat_impressions', 'section', null, !isHidden('stat_impressions'))}
                  />
                  <StatCard
                    label="Clicks"
                    value={formatNumber(summary.data.clicks)}
                    icon={<CursorIcon />}
                    iconBg="#d1fae5"
                    isImpersonating={isImpersonating}
                    isHidden={isHidden('stat_clicks')}
                    onVisibilityToggle={() => toggle('stat_clicks', 'section', null, !isHidden('stat_clicks'))}
                  />
                  <StatCard
                    label="CTR"
                    value={formatCTR(summary.data.ctr)}
                    icon={<PercentIcon />}
                    iconBg="#ede9fe"
                    ctrVsBenchmark={summary.data.ctr_vs_benchmark}
                    isImpersonating={isImpersonating}
                    isHidden={isHidden('stat_ctr')}
                    onVisibilityToggle={() => toggle('stat_ctr', 'section', null, !isHidden('stat_ctr'))}
                  />
                  <StatCard
                    label="MuslimReach"
                    value={formatNumber(Math.round(summary.data.impressions / 5))}
                    icon={<MosqueStatIcon />}
                    iconBg="#d1fae5"
                    infoTooltip="Approximate number of Muslims reached based on our network audience data."
                    isImpersonating={isImpersonating}
                    isHidden={isHidden('stat_muslimreach')}
                    onVisibilityToggle={() => toggle('stat_muslimreach', 'section', null, !isHidden('stat_muslimreach'))}
                  />
                  {conversionEnabled && (
                    <StatCard
                      label="Total Conversions"
                      value={conversionRaw.data ? formatConversions(conversionRaw.data.total_conversions) : '—'}
                      icon={<CheckCircleIcon />}
                      iconBg="#d1fae5"
                      isImpersonating={isImpersonating}
                      isHidden={isHidden('stat_conversions')}
                      onVisibilityToggle={() => toggle('stat_conversions', 'section', null, !isHidden('stat_conversions'))}
                    />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Divider: Summary → Conversion */}
        <IslamicDivider variant="full" />

        {/* Conversion cards */}
        {conversionEnabled && !conversionRaw.isLoading && !conversionRaw.error && (isImpersonating || !isHidden('conversion')) && (
          <div className="fade-in-up" style={{ animationDelay: '150ms', opacity: isHidden('conversion') ? 0.4 : 1, transition: 'opacity 200ms ease' }}>
            {isImpersonating && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Conversions</span>
                <VisibilityToggle
                  isHidden={isHidden('conversion')}
                  onToggle={() => toggle('conversion', 'section', null, !isHidden('conversion'))}
                  size="md"
                />
              </div>
            )}
            <ConversionCard data={conversionData} />
          </div>
        )}

        {/* Divider: Conversion → Device */}
        <IslamicDivider variant="simple" />

        {/* Device Breakdown */}
        <div className="fade-in-up" style={{ animationDelay: '200ms' }}>
          <SectionCard hidden={isHidden('device')} isImpersonating={isImpersonating}>
            <div className="px-5 pt-5 pb-3">
              <SectionHeading
                title="Device Breakdown"
                toggle={isImpersonating ? (
                  <VisibilityToggle
                    isHidden={isHidden('device')}
                    onToggle={() => toggle('device', 'section', null, !isHidden('device'))}
                  />
                ) : undefined}
              />
            </div>
            {device.isLoading ? (
              <div className="px-5 pb-5">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Donut ring placeholder */}
                  <div className="flex-shrink-0 relative" style={{ width: 200, height: 200 }}>
                    <Skeleton className="absolute inset-0 rounded-full" />
                    <div className="absolute rounded-full bg-white" style={{ inset: 45 }} />
                  </div>
                  {/* Legend rows */}
                  <div className="flex-1 w-full" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Skeleton style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0 }} />
                        <Skeleton style={{ height: 11, flex: 1, borderRadius: 6 }} />
                        <Skeleton style={{ height: 11, width: 56, borderRadius: 6, flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : device.error ? (
              <div className="px-5 pb-5"><ErrorBlock message="Device data temporarily unavailable — please refresh." /></div>
            ) : device.data ? (
              <DeviceBreakdownChart
                data={device.data}
                isImpersonating={isImpersonating}
                isRowHidden={(key) => isHidden('device', key)}
                onToggleRow={(key, hidden) => toggle('device', 'row', key, hidden)}
              />
            ) : null}
          </SectionCard>
        </div>

        {/* Divider: Device → Domain */}
        <IslamicDivider variant="simple" />

        {/* Domain Breakdown */}
        <div className="fade-in-up" style={{ animationDelay: '250ms' }}>
          <SectionCard hidden={isHidden('domain')} isImpersonating={isImpersonating}>
            <div className="px-5 pt-5 pb-3">
              <SectionHeading
                title="Domain Breakdown"
                toggle={isImpersonating ? (
                  <VisibilityToggle
                    isHidden={isHidden('domain')}
                    onToggle={() => toggle('domain', 'section', null, !isHidden('domain'))}
                  />
                ) : undefined}
              />
            </div>
            {site.isLoading ? (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Skeleton style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <Skeleton style={{ height: 12, borderRadius: 6, width: '70%' }} />
                          <Skeleton style={{ height: 10, borderRadius: 6, width: '45%' }} />
                        </div>
                        <Skeleton style={{ height: 12, borderRadius: 6, width: 44, flexShrink: 0 }} />
                      </div>
                      <Skeleton style={{ height: 6, borderRadius: 3, marginTop: 12 }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : site.error ? (
              <div className="px-5 pb-5"><ErrorBlock message="Domain data temporarily unavailable — please refresh." /></div>
            ) : site.data ? (
              <DomainBreakdownCards
                data={site.data.domains}
                totalImpressions={summary.data?.impressions ?? 0}
                isImpersonating={isImpersonating}
                isRowHidden={(key) => isHidden('domain', key)}
                onToggleRow={(key, hidden) => toggle('domain', 'row', key, hidden)}
              />
            ) : null}
          </SectionCard>
        </div>

        {/* Divider: Domain → App */}
        <IslamicDivider variant="simple" />

        {/* App Breakdown */}
        <div className="fade-in-up" style={{ animationDelay: '300ms' }}>
          <SectionCard hidden={isHidden('app')} isImpersonating={isImpersonating}>
            <div className="px-5 pt-5 pb-3">
              <SectionHeading
                title="App Breakdown"
                toggle={isImpersonating ? (
                  <VisibilityToggle
                    isHidden={isHidden('app')}
                    onToggle={() => toggle('app', 'section', null, !isHidden('app'))}
                  />
                ) : undefined}
              />
            </div>
            {site.isLoading ? (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Skeleton style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <Skeleton style={{ height: 12, borderRadius: 6, width: '70%' }} />
                          <Skeleton style={{ height: 10, borderRadius: 6, width: '45%' }} />
                        </div>
                        <Skeleton style={{ height: 12, borderRadius: 6, width: 44, flexShrink: 0 }} />
                      </div>
                      <Skeleton style={{ height: 6, borderRadius: 3, marginTop: 12 }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : site.error ? (
              <div className="px-5 pb-5"><ErrorBlock message="App data temporarily unavailable — please refresh." /></div>
            ) : site.data ? (
              <AppBreakdownCards
                data={site.data.apps}
                totalImpressions={summary.data?.impressions ?? 0}
                isImpersonating={isImpersonating}
                isRowHidden={(key) => isHidden('app', key)}
                onToggleRow={(key, hidden) => toggle('app', 'row', key, hidden)}
              />
            ) : null}
          </SectionCard>
        </div>

        {/* Divider: App → Creative */}
        <IslamicDivider variant="simple" />

        {/* Creative Breakdown */}
        <div className="fade-in-up" style={{ animationDelay: '350ms' }}>
          <SectionCard hidden={isHidden('creative')} isImpersonating={isImpersonating}>
            <div className="px-5 pt-5 pb-3">
              <SectionHeading
                title="Creative Breakdown"
                toggle={isImpersonating ? (
                  <VisibilityToggle
                    isHidden={isHidden('creative')}
                    onToggle={() => toggle('creative', 'section', null, !isHidden('creative'))}
                  />
                ) : undefined}
              />
            </div>
            {creative.isLoading || creativeMetaLoading ? (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <Skeleton style={{ height: 160 }} />
                      <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Skeleton style={{ height: 14, borderRadius: 6, width: '75%' }} />
                        <Skeleton style={{ height: 6, borderRadius: 3 }} />
                        <Skeleton style={{ height: 12, borderRadius: 6, width: '55%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : creative.error ? (
              <div className="px-5 pb-5"><ErrorBlock message="Creative data temporarily unavailable — please refresh." /></div>
            ) : creative.data ? (
              <CreativeBreakdownGrid
                data={creative.data}
                metadata={creativeMetadata}
                isLoadingMetadata={false}
                totalImpressions={summary.data?.impressions ?? 0}
                isImpersonating={isImpersonating}
                isRowHidden={(key) => isHidden('creative', key)}
                onToggleRow={(key, hidden) => toggle('creative', 'row', key, hidden)}
                topPerformerName={
                  creative.data.length > 0
                    ? creative.data.filter(r => r.impressions >= 100).sort((a, b) => b.ctr - a.ctr)[0]?.creative_name
                    : undefined
                }
              />
            ) : null}
          </SectionCard>
        </div>

        {/* MasjidConnect — always shown (showcase or marketing) */}
        {(isImpersonating || !isHidden('masjidconnect')) && (
          <>
            <IslamicDivider variant="simple" />
            <div
              className="fade-in-up"
              style={{
                animationDelay: '400ms',
                opacity: isHidden('masjidconnect') ? 0.4 : 1,
                transition: 'opacity 200ms ease',
              }}
            >
              {isImpersonating && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">MasjidConnect</span>
                  <VisibilityToggle
                    isHidden={isHidden('masjidconnect')}
                    onToggle={() => toggle('masjidconnect', 'section', null, !isHidden('masjidconnect'))}
                    size="md"
                  />
                </div>
              )}
              <MasjidConnectSection data={masjidData} isLoading={masjidLoading} />
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <RouteGuard requiredRole="client">
      <DashboardContent />
    </RouteGuard>
  )
}
