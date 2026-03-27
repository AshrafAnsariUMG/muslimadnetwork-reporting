export interface SummaryReport {
  impressions: number
  clicks: number
  ctr: number
  date_from: string
  date_to: string
  network_avg_ctr?: number
  ctr_vs_benchmark?: number
}

export interface DeviceRow {
  device: string
  impressions: number
  clicks: number
  ctr: number
}

export interface DomainRow {
  domain: string
  impressions: number
  clicks: number
  ctr: number
}

export interface AppRow {
  app: string
  app_id: string | null
  impressions: number
  clicks: number
  ctr: number
}

export interface SiteBreakdown {
  domains: DomainRow[]
  apps: AppRow[]
}

export interface CreativeRow {
  creative_name: string
  size: string
  impressions: number
  clicks: number
  ctr: number
  performance_status?: string
  vs_campaign_avg?: number
  vs_network_avg?: number
  fatigue_risk?: boolean
  recommendation?: string | null
}

export interface CreativeMetadata {
  id: string
  name: string
  type: string
  width: number
  height: number
  preview_url: string | null
}

export interface ConversionReport {
  available: boolean
  total_conversions?: number
  total_conversion_value?: number
}

export interface Campaign {
  id: number
  name: string
  status: string
  start_date: string
  contracted_impressions: number | null
  contracted_clicks: number | null
  has_conversion_tracking: boolean
  cm360_campaign_id: string
  is_primary: boolean
}

export interface Client {
  id: number
  name: string
  logo_url: string | null
  primary_color: string | null
  client_type: string
  features: Record<string, unknown> | null
}

export interface MasjidEntry {
  id: number
  masjid_name: string
  city: string
  country: string
  screen_photo_url: string
  sort_order: number
}

export interface MasjidConnectData {
  enabled: boolean
  masjids: MasjidEntry[]
}
