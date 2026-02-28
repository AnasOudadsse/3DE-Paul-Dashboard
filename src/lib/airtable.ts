import Airtable from "airtable";
import type {
  DashboardData,
  LeadTierData,
  PriorityContact,
  SalesVelocityPoint,
  ProductPerformance,
  CollectionContact,
  DepositRecord,
  FunnelStep,
  UTMCampaignData,
  ObstacleData,
} from "./types";

const TIER_COLORS: Record<string, string> = {
  "Tier A": "var(--color-tierA)",
  "Tier B": "var(--color-tierB)",
  "Tier C": "var(--color-tierC)",
  "Tier D": "var(--color-tierD)",
};

const FUNNEL_COLORS: Record<string, string> = {
  "Free Ticket": "var(--color-freeTicket)",
  "VIP Upgrade": "var(--color-vipUpgrade)",
  "Zoom Registration": "var(--color-zoomReg)",
};

function getBase() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables");
  }

  Airtable.configure({ apiKey });
  return Airtable.base(baseId);
}

async function fetchAllRecords(
  tableName: string,
  options: {
    fields?: string[];
    filterByFormula?: string;
    sort?: Array<{ field: string; direction: "asc" | "desc" }>;
  } = {}
): Promise<Airtable.Record<Airtable.FieldSet>[]> {
  const base = getBase();
  const records: Airtable.Record<Airtable.FieldSet>[] = [];

  const queryParams: Record<string, unknown> = {};
  if (options.fields) queryParams.fields = options.fields;
  if (options.filterByFormula) queryParams.filterByFormula = options.filterByFormula;
  if (options.sort) queryParams.sort = options.sort;

  await new Promise<void>((resolve, reject) => {
    base(tableName)
      .select(queryParams)
      .eachPage(
        (pageRecords, fetchNextPage) => {
          records.push(...pageRecords);
          fetchNextPage();
        },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
  });

  return records;
}

async function fetchKPIs() {
  const deposits = await fetchAllRecords("Deposits", {
    fields: ["Amount", "Type"],
  });

  let totalRevenue = 0;
  let totalRefunds = 0;

  for (const record of deposits) {
    const amount = (record.get("Amount") as number) || 0;
    const type = record.get("Type") as string;
    if (type === "Refund") {
      totalRefunds += amount;
    } else {
      totalRevenue += amount;
    }
  }

  const contacts = await fetchAllRecords("Contacts", {
    fields: ["Total balance"],
    filterByFormula: "{Total balance} > 0",
  });

  let outstandingPipeline = 0;
  for (const record of contacts) {
    outstandingPipeline += (record.get("Total balance") as number) || 0;
  }

  const sales = await fetchAllRecords("Sales", {
    fields: ["Order ID"],
  });

  return {
    totalRevenue: totalRevenue - totalRefunds,
    outstandingPipeline,
    totalUpfrontSales: sales.length,
  };
}

async function fetchPipelineQuality(): Promise<LeadTierData[]> {
  const surveys = await fetchAllRecords("Surveys", {
    fields: ["Lead Tier"],
  });

  const tierCounts: Record<string, number> = {};
  for (const record of surveys) {
    const rawTier = (record.get("Lead Tier") as string) || "Unknown";
    const tier = rawTier.includes("Tier A")
      ? "Tier A"
      : rawTier.includes("Tier B")
        ? "Tier B"
        : rawTier.includes("Tier C")
          ? "Tier C"
          : rawTier.includes("Tier D")
            ? "Tier D"
            : "Unknown";
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  }

  return Object.entries(tierCounts)
    .filter(([tier]) => tier !== "Unknown")
    .map(([tier, count]) => ({
      tier,
      count,
      fill: TIER_COLORS[tier] || "var(--color-tierD)",
    }))
    .sort((a, b) => a.tier.localeCompare(b.tier));
}

async function fetchPriorityCallList(): Promise<PriorityContact[]> {
  const surveys = await fetchAllRecords("Surveys", {
    fields: ["Email", "Base Score", "Lead Tier"],
  });

  const surveyMap = new Map<string, { score: number; tier: string }>();
  for (const record of surveys) {
    const email = (record.get("Email") as string) || "";
    const rawTier = (record.get("Lead Tier") as string) || "";
    const tier = rawTier.includes("Tier A")
      ? "Tier A"
      : rawTier.includes("Tier B")
        ? "Tier B"
        : rawTier.includes("Tier C")
          ? "Tier C"
          : "Tier D";
    const score = (record.get("Base Score") as number) || 0;

    if (tier === "Tier A" || tier === "Tier B") {
      if (email) surveyMap.set(email.toLowerCase(), { score, tier });
    }
  }

  if (surveyMap.size === 0) return [];

  const contacts = await fetchAllRecords("Contacts", {
    fields: ["Full Name", "Phone", "Email"],
  });

  const results: PriorityContact[] = [];
  for (const contact of contacts) {
    const email = (contact.get("Email") as string) || "";
    const surveyData = surveyMap.get(email.toLowerCase());
    if (surveyData) {
      results.push({
        name: (contact.get("Full Name") as string) || "Unknown",
        phone: (contact.get("Phone") as string) || "—",
        email,
        totalScore: surveyData.score,
        leadTier: surveyData.tier,
      });
    }
  }

  return results.sort((a, b) => b.totalScore - a.totalScore).slice(0, 50);
}

async function fetchSalesVelocity(): Promise<SalesVelocityPoint[]> {
  const sales = await fetchAllRecords("Sales", {
    fields: ["Date", "Product Price"],
  });

  const dateMap: Record<string, number> = {};
  for (const record of sales) {
    const dateRaw = record.get("Date") as string;
    if (!dateRaw) continue;
    const day = dateRaw.split("T")[0];
    const rawPrice = record.get("Product Price");
    const price = Array.isArray(rawPrice) ? Number(rawPrice[0]) || 0 : Number(rawPrice) || 0;
    dateMap[day] = (dateMap[day] || 0) + price;
  }

  return Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));
}

async function fetchTopProducts(): Promise<ProductPerformance[]> {
  const sales = await fetchAllRecords("Sales", {
    fields: ["Product Name", "Product Price"],
  });

  const productMap: Record<string, { count: number; revenue: number }> = {};
  for (const record of sales) {
    const nameField = record.get("Product Name");
    const name = Array.isArray(nameField) ? nameField[0] : (nameField as string) || "Unknown";
    const priceField = record.get("Product Price");
    const price = Array.isArray(priceField) ? priceField[0] : (priceField as number) || 0;

    if (!productMap[name]) productMap[name] = { count: 0, revenue: 0 };
    productMap[name].count += 1;
    productMap[name].revenue += typeof price === "number" ? price : 0;
  }

  return Object.entries(productMap)
    .map(([product, data]) => ({ product, ...data }))
    .sort((a, b) => b.count - a.count);
}

async function fetchCollectionList(): Promise<CollectionContact[]> {
  const contacts = await fetchAllRecords("Contacts", {
    fields: ["Full Name", "Phone", "Email", "Total balance"],
    filterByFormula: "{Total balance} > 0",
  });

  return contacts
    .map((record) => ({
      name: (record.get("Full Name") as string) || "Unknown",
      phone: (record.get("Phone") as string) || "—",
      email: (record.get("Email") as string) || "—",
      balance: (record.get("Total balance") as number) || 0,
    }))
    .sort((a, b) => b.balance - a.balance);
}

async function fetchDeposits(): Promise<DepositRecord[]> {
  const deposits = await fetchAllRecords("Deposits", {
    fields: ["Amount", "Type", "Date", "Contacts"],
  });

  return deposits.map((record) => {
    const contactField = record.get("Contacts");
    const contactName = Array.isArray(contactField) ? String(contactField[0]) : "";
    return {
      name: contactName || "—",
      amount: (record.get("Amount") as number) || 0,
      type: (record.get("Type") as string) || "Unknown",
      date: (record.get("Date") as string) || "",
    };
  });
}

async function fetchUpgradeFunnel(): Promise<FunnelStep[]> {
  const actions = await fetchAllRecords("Action Logs", {
    fields: ["Action"],
  });

  const stepCounts: Record<string, number> = {
    "Free Ticket": 0,
    "VIP Upgrade": 0,
    "Zoom Registration": 0,
  };

  for (const record of actions) {
    const action = (record.get("Action") as string) || "";
    const lower = action.toLowerCase();
    if (lower.includes("free ticket") || lower.includes("got free ticket")) {
      stepCounts["Free Ticket"]++;
    } else if (lower.includes("vip upgrade") || lower.includes("upsell")) {
      stepCounts["VIP Upgrade"]++;
    } else if (lower.includes("zoom registration") || lower.includes("zoom")) {
      stepCounts["Zoom Registration"]++;
    }
  }

  return [
    { step: "Free Ticket", count: stepCounts["Free Ticket"], fill: FUNNEL_COLORS["Free Ticket"] },
    { step: "VIP Upgrade", count: stepCounts["VIP Upgrade"], fill: FUNNEL_COLORS["VIP Upgrade"] },
    { step: "Zoom Registration", count: stepCounts["Zoom Registration"], fill: FUNNEL_COLORS["Zoom Registration"] },
  ];
}

async function fetchTrafficSources(): Promise<UTMCampaignData[]> {
  const actions = await fetchAllRecords("Action Logs", {
    fields: ["Action", "UTM Campaign"],
    filterByFormula: 'FIND("VIP", {Action})',
  });

  const campaignCounts: Record<string, number> = {};
  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  for (const record of actions) {
    const campaign = (record.get("UTM Campaign") as string) || "Direct / None";
    campaignCounts[campaign] = (campaignCounts[campaign] || 0) + 1;
  }

  return Object.entries(campaignCounts)
    .map(([campaign, count], i) => ({
      campaign,
      count,
      fill: palette[i % palette.length],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

async function fetchAudiencePainPoints(): Promise<ObstacleData[]> {
  const surveys = await fetchAllRecords("Surveys", {
    fields: ["Biggest Obstacle"],
  });

  const obstacleCounts: Record<string, number> = {};
  for (const record of surveys) {
    const obstacle = (record.get("Biggest Obstacle") as string) || "Not Specified";
    obstacleCounts[obstacle] = (obstacleCounts[obstacle] || 0) + 1;
  }

  return Object.entries(obstacleCounts)
    .map(([obstacle, count]) => ({ obstacle, count }))
    .sort((a, b) => b.count - a.count);
}

async function safeFetch<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[Airtable] FAILED: "${label}"`, err);
    return fallback;
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [
    kpis,
    pipelineQuality,
    priorityCallList,
    salesVelocity,
    topProducts,
    collectionList,
    deposits,
    upgradeFunnel,
    trafficSources,
    audiencePainPoints,
  ] = await Promise.all([
    safeFetch("KPIs", fetchKPIs, { totalRevenue: 0, outstandingPipeline: 0, totalUpfrontSales: 0 }),
    safeFetch("PipelineQuality", fetchPipelineQuality, []),
    safeFetch("PriorityCallList", fetchPriorityCallList, []),
    safeFetch("SalesVelocity", fetchSalesVelocity, []),
    safeFetch("TopProducts", fetchTopProducts, []),
    safeFetch("CollectionList", fetchCollectionList, []),
    safeFetch("Deposits", fetchDeposits, []),
    safeFetch("UpgradeFunnel", fetchUpgradeFunnel, []),
    safeFetch("TrafficSources", fetchTrafficSources, []),
    safeFetch("AudiencePainPoints", fetchAudiencePainPoints, []),
  ]);

  return {
    kpis,
    pipelineQuality,
    priorityCallList,
    salesVelocity,
    topProducts,
    collectionList,
    deposits,
    upgradeFunnel,
    trafficSources,
    audiencePainPoints,
    lastUpdated: new Date().toISOString(),
  };
}
