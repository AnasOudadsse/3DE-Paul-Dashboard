export interface KPIData {
  totalRevenue: number;
  outstandingPipeline: number;
  totalUpfrontSales: number;
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

export interface DashboardData {
  kpis: KPIData;
  pipelineQuality: LeadTierData[];
  priorityCallList: PriorityContact[];
  salesVelocity: SalesVelocityPoint[];
  topProducts: ProductPerformance[];
  collectionList: CollectionContact[];
  deposits: DepositRecord[];
  upgradeFunnel: FunnelStep[];
  trafficSources: UTMCampaignData[];
  audiencePainPoints: ObstacleData[];
  lastUpdated: string;
}
