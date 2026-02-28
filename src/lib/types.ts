export interface KPIData {
  depositRevenue: number;
  productRevenue: number;
  totalRevenue: number;
}

export interface LeadTierData {
  tier: string;
  count: number;
  fill: string;
}

export interface PriorityContact {
  name: string;
  phone: string;
  email: string;
  totalScore: number;
  leadTier: string;
}

export interface SalesVelocityPoint {
  date: string;
  revenue: number;
}

export interface ProductPerformance {
  product: string;
  count: number;
  revenue: number;
}

export interface CollectionContact {
  name: string;
  phone: string;
  email: string;
  balance: number;
}

export interface DepositRecord {
  name: string;
  amount: number;
  type: string;
  date: string;
}

export interface FunnelStep {
  step: string;
  count: number;
  fill: string;
}

export interface UTMCampaignData {
  campaign: string;
  count: number;
  fill: string;
}

export interface ObstacleData {
  obstacle: string;
  count: number;
}

export interface ContactRecord {
  name: string;
  email: string;
  phone: string;
  totalDeposits: number;
  totalRemaining: number;
  totalRefunds: number;
  totalBalance: number;
  registrations: number;
}

export interface AttendanceRecord {
  guestName: string;
  guestEmail: string;
  joinTime: string;
  leaveTime: string;
  durationMinutes: number;
  action: string;
  engagementType: string;
  meetingName: string;
}

export interface DayAttendee {
  guestEmail: string;
  watchTimeMinutes: number;
  watchTimeFormatted: string;
  leadScore: string;
}

export interface DayAttendanceData {
  day: number;
  label: string;
  attendees: DayAttendee[];
}

export interface CampaignActionData {
  campaign: string;
  freeTicket: number;
  vipUpgrade: number;
  upsell: number;
  zoomReg: number;
  total: number;
}

export interface BuyerAttributionData {
  campaign: string;
  productBuyers: number;
  depositBuyers: number;
  totalBuyers: number;
}

export interface DashboardData {
  kpis: KPIData;
  pipelineQuality: LeadTierData[];
  priorityCallList: PriorityContact[];
  audiencePainPoints: ObstacleData[];
  salesVelocity: SalesVelocityPoint[];
  topProducts: ProductPerformance[];
  collectionList: CollectionContact[];
  deposits: DepositRecord[];
  upgradeFunnel: FunnelStep[];
  campaignActions: CampaignActionData[];
  mediumBreakdown: UTMCampaignData[];
  contentBreakdown: UTMCampaignData[];
  termBreakdown: UTMCampaignData[];
  buyerAttribution: BuyerAttributionData[];
  contacts: ContactRecord[];
  attendanceLogs: AttendanceRecord[];
  dayAttendance: DayAttendanceData[];
  lastUpdated: string;
}
