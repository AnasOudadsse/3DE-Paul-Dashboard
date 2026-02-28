import Airtable from "airtable";
import type {
  DashboardData,
  KPIData,
  LeadTierData,
  PriorityContact,
  SalesVelocityPoint,
  ProductPerformance,
  CollectionContact,
  DepositRecord,
  FunnelStep,
  UTMCampaignData,
  ObstacleData,
  ContactRecord,
  AttendanceRecord,
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
  "Upsell Purchase": "var(--color-zoomReg)",
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
        (err) => (err ? reject(err) : resolve())
      );
  });
  return records;
}

// ── KPIs ──

async function fetchKPIs(): Promise<KPIData> {
  const [deposits, sales] = await Promise.all([
    fetchAllRecords("Deposits", { fields: ["Amount", "Type"] }),
    fetchAllRecords("Sales", { fields: ["Product Price"] }),
  ]);

  let depositRevenue = 0;
  for (const r of deposits) {
    const amount = (r.get("Amount") as number) || 0;
    const type = r.get("Type") as string;
    if (type === "Refund") depositRevenue -= amount;
    else depositRevenue += amount;
  }

  let productRevenue = 0;
  for (const r of sales) {
    const raw = r.get("Product Price");
    productRevenue += Array.isArray(raw) ? Number(raw[0]) || 0 : Number(raw) || 0;
  }

  return {
    depositRevenue,
    productRevenue,
    totalRevenue: depositRevenue + productRevenue,
  };
}

// ── Survey / Pipeline ──

async function fetchPipelineQuality(): Promise<LeadTierData[]> {
  const surveys = await fetchAllRecords("Surveys", { fields: ["Lead Tier"] });
  const tierCounts: Record<string, number> = {};
  for (const r of surveys) {
    const raw = (r.get("Lead Tier") as string) || "Unknown";
    const tier = raw.includes("Tier A") ? "Tier A"
      : raw.includes("Tier B") ? "Tier B"
      : raw.includes("Tier C") ? "Tier C"
      : raw.includes("Tier D") ? "Tier D"
      : "Unknown";
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  }
  return Object.entries(tierCounts)
    .filter(([t]) => t !== "Unknown")
    .map(([tier, count]) => ({ tier, count, fill: TIER_COLORS[tier] || "var(--color-tierD)" }))
    .sort((a, b) => a.tier.localeCompare(b.tier));
}

async function fetchPriorityCallList(): Promise<PriorityContact[]> {
  const surveys = await fetchAllRecords("Surveys", { fields: ["Email", "Base Score", "Lead Tier"] });
  const surveyMap = new Map<string, { score: number; tier: string }>();
  for (const r of surveys) {
    const email = (r.get("Email") as string) || "";
    const raw = (r.get("Lead Tier") as string) || "";
    const tier = raw.includes("Tier A") ? "Tier A" : raw.includes("Tier B") ? "Tier B" : raw.includes("Tier C") ? "Tier C" : "Tier D";
    const score = (r.get("Base Score") as number) || 0;
    if ((tier === "Tier A" || tier === "Tier B") && email) {
      surveyMap.set(email.toLowerCase(), { score, tier });
    }
  }
  if (surveyMap.size === 0) return [];

  const contacts = await fetchAllRecords("Contacts", { fields: ["Full Name", "Phone", "Email"] });
  const results: PriorityContact[] = [];
  for (const c of contacts) {
    const email = (c.get("Email") as string) || "";
    const data = surveyMap.get(email.toLowerCase());
    if (data) {
      results.push({
        name: (c.get("Full Name") as string) || "Unknown",
        phone: (c.get("Phone") as string) || "—",
        email,
        totalScore: data.score,
        leadTier: data.tier,
      });
    }
  }
  return results.sort((a, b) => b.totalScore - a.totalScore).slice(0, 50);
}

async function fetchAudiencePainPoints(): Promise<ObstacleData[]> {
  const surveys = await fetchAllRecords("Surveys", { fields: ["Biggest Obstacle"] });
  const counts: Record<string, number> = {};
  for (const r of surveys) {
    const obstacle = (r.get("Biggest Obstacle") as string) || "Not Specified";
    counts[obstacle] = (counts[obstacle] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([obstacle, count]) => ({ obstacle, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Sales ──

async function fetchSalesVelocity(): Promise<SalesVelocityPoint[]> {
  const sales = await fetchAllRecords("Sales", { fields: ["Date", "Product Price"] });
  const dateMap: Record<string, number> = {};
  for (const r of sales) {
    const dateRaw = r.get("Date") as string;
    if (!dateRaw) continue;
    const day = dateRaw.split("T")[0];
    const raw = r.get("Product Price");
    const price = Array.isArray(raw) ? Number(raw[0]) || 0 : Number(raw) || 0;
    dateMap[day] = (dateMap[day] || 0) + price;
  }
  return Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, revenue]) => ({ date, revenue }));
}

async function fetchTopProducts(): Promise<ProductPerformance[]> {
  const sales = await fetchAllRecords("Sales", { fields: ["Product Name", "Product Price"] });
  const map: Record<string, { count: number; revenue: number }> = {};
  for (const r of sales) {
    const nameField = r.get("Product Name");
    const name = Array.isArray(nameField) ? nameField[0] : (nameField as string) || "Unknown";
    const priceField = r.get("Product Price");
    const price = Array.isArray(priceField) ? priceField[0] : (priceField as number) || 0;
    if (!map[name]) map[name] = { count: 0, revenue: 0 };
    map[name].count += 1;
    map[name].revenue += typeof price === "number" ? price : 0;
  }
  return Object.entries(map).map(([product, d]) => ({ product, ...d })).sort((a, b) => b.count - a.count);
}

async function fetchCollectionList(): Promise<CollectionContact[]> {
  const contacts = await fetchAllRecords("Contacts", {
    fields: ["Full Name", "Phone", "Email", "Total balance"],
    filterByFormula: "{Total balance} > 0",
  });
  return contacts
    .map((r) => ({
      name: (r.get("Full Name") as string) || "Unknown",
      phone: (r.get("Phone") as string) || "—",
      email: (r.get("Email") as string) || "—",
      balance: (r.get("Total balance") as number) || 0,
    }))
    .sort((a, b) => b.balance - a.balance);
}

async function fetchDeposits(): Promise<DepositRecord[]> {
  const deposits = await fetchAllRecords("Deposits", {
    fields: ["Amount", "Type", "Date", "Contacts"],
  });
  return deposits.map((r) => {
    const contactField = r.get("Contacts");
    return {
      name: Array.isArray(contactField) ? String(contactField[0]) : "—",
      amount: (r.get("Amount") as number) || 0,
      type: (r.get("Type") as string) || "Unknown",
      date: (r.get("Date") as string) || "",
    };
  });
}

// ── Funnel ──

async function fetchUpgradeFunnel(): Promise<FunnelStep[]> {
  const actions = await fetchAllRecords("Action Logs", { fields: ["Action"] });
  const counts = { "Free Ticket": 0, "VIP Upgrade": 0, "Upsell Purchase": 0 };
  for (const r of actions) {
    const action = ((r.get("Action") as string) || "").toLowerCase();
    if (action.includes("free ticket") || action.includes("got free ticket")) {
      counts["Free Ticket"]++;
    } else if (action.includes("vip upgrade")) {
      counts["VIP Upgrade"]++;
    } else if (action.includes("upsell")) {
      counts["Upsell Purchase"]++;
    }
  }
  return [
    { step: "Free Ticket", count: counts["Free Ticket"], fill: FUNNEL_COLORS["Free Ticket"] },
    { step: "VIP Upgrade", count: counts["VIP Upgrade"], fill: FUNNEL_COLORS["VIP Upgrade"] },
    { step: "Upsell Purchase", count: counts["Upsell Purchase"], fill: FUNNEL_COLORS["Upsell Purchase"] },
  ];
}

async function fetchActionSources(): Promise<UTMCampaignData[]> {
  const actions = await fetchAllRecords("Action Logs", { fields: ["Action"] });
  const counts: Record<string, number> = {};
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  for (const r of actions) {
    const action = (r.get("Action") as string) || "Unknown";
    counts[action] = (counts[action] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([campaign, count], i) => ({ campaign, count, fill: palette[i % palette.length] }))
    .sort((a, b) => b.count - a.count);
}

async function fetchTrafficSources(): Promise<UTMCampaignData[]> {
  const actions = await fetchAllRecords("Action Logs", {
    fields: ["Action", "UTM Campaign"],
    filterByFormula: 'FIND("VIP", {Action})',
  });
  const counts: Record<string, number> = {};
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  for (const r of actions) {
    const campaign = (r.get("UTM Campaign") as string) || "Direct / None";
    counts[campaign] = (counts[campaign] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([campaign, count], i) => ({ campaign, count, fill: palette[i % palette.length] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

// ── Contacts ──

async function fetchContacts(): Promise<ContactRecord[]> {
  const contacts = await fetchAllRecords("Contacts", {
    fields: ["Full Name", "Email", "Phone", "Total Deposits", "Total Remaining", "Total Refunds", "Total balance", "Registrations"],
  });
  return contacts.map((r) => {
    const regField = r.get("Registrations");
    return {
      name: (r.get("Full Name") as string) || "Unknown",
      email: (r.get("Email") as string) || "—",
      phone: (r.get("Phone") as string) || "—",
      totalDeposits: (r.get("Total Deposits") as number) || 0,
      totalRemaining: (r.get("Total Remaining") as number) || 0,
      totalRefunds: (r.get("Total Refunds") as number) || 0,
      totalBalance: (r.get("Total balance") as number) || 0,
      registrations: Array.isArray(regField) ? regField.length : 0,
    };
  });
}

// ── Attendance Logs ──

async function fetchAttendanceLogs(): Promise<AttendanceRecord[]> {
  const logs = await fetchAllRecords("Attendance Logs");
  return logs.map((r) => {
    const meetingField = r.get("Name (from MeetingID)");
    return {
      guestName: (r.get("Guest Name") as string) || "—",
      guestEmail: (r.get("Guest Email") as string) || "—",
      joinTime: (r.get("join_time") as string) || "",
      leaveTime: (r.get("leave_time") as string) || "",
      durationMinutes: (r.get("Duration in minutes") as number) || 0,
      action: "—",
      engagementType: "—",
      meetingName: Array.isArray(meetingField) ? String(meetingField[0]) : "—",
    };
  });
}

// ── Orchestrator ──

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
    audiencePainPoints,
    salesVelocity,
    topProducts,
    collectionList,
    deposits,
    upgradeFunnel,
    actionSources,
    trafficSources,
    contacts,
    attendanceLogs,
  ] = await Promise.all([
    safeFetch("KPIs", fetchKPIs, { depositRevenue: 0, productRevenue: 0, totalRevenue: 0 }),
    safeFetch("PipelineQuality", fetchPipelineQuality, []),
    safeFetch("PriorityCallList", fetchPriorityCallList, []),
    safeFetch("AudiencePainPoints", fetchAudiencePainPoints, []),
    safeFetch("SalesVelocity", fetchSalesVelocity, []),
    safeFetch("TopProducts", fetchTopProducts, []),
    safeFetch("CollectionList", fetchCollectionList, []),
    safeFetch("Deposits", fetchDeposits, []),
    safeFetch("UpgradeFunnel", fetchUpgradeFunnel, []),
    safeFetch("ActionSources", fetchActionSources, []),
    safeFetch("TrafficSources", fetchTrafficSources, []),
    safeFetch("Contacts", fetchContacts, []),
    safeFetch("AttendanceLogs", fetchAttendanceLogs, []),
  ]);

  return {
    kpis,
    pipelineQuality,
    priorityCallList,
    audiencePainPoints,
    salesVelocity,
    topProducts,
    collectionList,
    deposits,
    upgradeFunnel,
    actionSources,
    trafficSources,
    contacts,
    attendanceLogs,
    lastUpdated: new Date().toISOString(),
  };
}
