import { unstable_cache } from "next/cache";
import { fetchDashboardData } from "@/lib/airtable";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { DashboardData } from "@/lib/types";

const getCachedData = unstable_cache(
  async (): Promise<DashboardData> => {
    return fetchDashboardData();
  },
  ["dashboard-data"],
  { revalidate: 300 }
);

export default async function DashboardPage() {
  let data: DashboardData;

  try {
    data = await getCachedData();
  } catch {
    data = {
      kpis: { totalRevenue: 0, outstandingPipeline: 0, totalUpfrontSales: 0 },
      pipelineQuality: [
        { tier: "Tier A", count: 24, fill: "var(--color-tierA)" },
        { tier: "Tier B", count: 58, fill: "var(--color-tierB)" },
        { tier: "Tier C", count: 89, fill: "var(--color-tierC)" },
        { tier: "Tier D", count: 31, fill: "var(--color-tierD)" },
      ],
      priorityCallList: [],
      salesVelocity: [],
      topProducts: [],
      collectionList: [],
      upgradeFunnel: [
        { step: "Free Ticket", count: 0, fill: "var(--color-freeTicket)" },
        { step: "VIP Upgrade", count: 0, fill: "var(--color-vipUpgrade)" },
        { step: "Zoom Registration", count: 0, fill: "var(--color-zoomReg)" },
      ],
      trafficSources: [],
      audiencePainPoints: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  return <DashboardShell data={data} />;
}
