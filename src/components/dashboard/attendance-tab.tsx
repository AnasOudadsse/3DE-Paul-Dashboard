"use client";

import { useMemo, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis,
  Cell, Pie, PieChart, Label,
} from "recharts";
import { Search, Clock, Users, TrendingDown, Flame, Timer } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { AttendanceRecord, DayAttendanceData } from "@/lib/types";

interface AttendanceTabProps {
  attendanceLogs: AttendanceRecord[];
  dayAttendance?: DayAttendanceData[];
}

const LEAD_SCORE_MAP: Record<string, { label: string; color: string; order: number }> = {
  "hot":     { label: "Hot Lead",       color: "var(--chart-1)", order: 0 },
  "warm":    { label: "Warm Lead",      color: "var(--chart-2)", order: 1 },
  "bounced": { label: "Bounced Early",  color: "var(--chart-4)", order: 2 },
  "no show": { label: "No Show",        color: "var(--chart-5)", order: 3 },
};

function classifyScore(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("hot")) return "hot";
  if (lower.includes("warm")) return "warm";
  if (lower.includes("bounced")) return "bounced";
  if (lower.includes("no show")) return "no show";
  return "unknown";
}

const DAY_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

const attendanceByDayConfig: ChartConfig = {
  attendees: { label: "Attendees", color: "var(--chart-1)" },
};

const leadScoreConfig: ChartConfig = {
  hot: { label: "Hot Lead", color: "var(--chart-1)" },
  warm: { label: "Warm Lead", color: "var(--chart-2)" },
  bounced: { label: "Bounced Early", color: "var(--chart-4)" },
  "no show": { label: "No Show", color: "var(--chart-5)" },
};

const overallScoreConfig: ChartConfig = {
  count: { label: "Attendees", color: "var(--chart-1)" },
};

function formatDuration(minutes: number): string {
  if (minutes < 1) return "<1m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function AttendanceTab({ attendanceLogs: _logs, dayAttendance = [] }: AttendanceTabProps) {
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("all");

  const days = dayAttendance;

  // Per-day stats
  const dayStats = useMemo(() => days.map((d) => {
    const total = d.attendees.length;
    const totalMinutes = d.attendees.reduce((s, a) => s + a.watchTimeMinutes, 0);
    const scores: Record<string, number> = {};
    d.attendees.forEach((a) => {
      const key = classifyScore(a.leadScore);
      scores[key] = (scores[key] || 0) + 1;
    });
    return {
      day: d.day,
      label: d.label,
      total,
      totalMinutes,
      avgMinutes: total > 0 ? totalMinutes / total : 0,
      scores,
    };
  }), [days]);

  // Unique attendees across all days (by email)
  const allEmails = useMemo(() => {
    const set = new Set<string>();
    days.forEach((d) => d.attendees.forEach((a) => set.add(a.guestEmail.toLowerCase())));
    return set;
  }, [days]);

  const totalUniqueAttendees = allEmails.size;

  // Retention: how many Day 1 attendees came back on Day 2, Day 3
  const retentionData = useMemo(() => {
    const emailsByDay = days.map((d) => new Set(d.attendees.map((a) => a.guestEmail.toLowerCase())));
    if (emailsByDay.length < 2) return [];
    const day1Set = emailsByDay[0] || new Set();
    return days.map((d, i) => {
      const daySet = emailsByDay[i] || new Set();
      const retained = [...day1Set].filter((e) => daySet.has(e)).length;
      const rate = day1Set.size > 0 ? (retained / day1Set.size) * 100 : 0;
      return { label: d.label, retained, rate, total: daySet.size };
    });
  }, [days]);

  // Overall lead score distribution
  const overallScores = useMemo(() => {
    const counts: Record<string, number> = {};
    days.forEach((d) => d.attendees.forEach((a) => {
      const key = classifyScore(a.leadScore);
      counts[key] = (counts[key] || 0) + 1;
    }));
    return Object.entries(counts)
      .map(([key, count]) => ({
        key,
        label: LEAD_SCORE_MAP[key]?.label || key,
        count,
        fill: LEAD_SCORE_MAP[key]?.color || "var(--chart-3)",
        order: LEAD_SCORE_MAP[key]?.order ?? 99,
      }))
      .sort((a, b) => a.order - b.order);
  }, [days]);

  const overallScoreTotal = overallScores.reduce((s, o) => s + o.count, 0);

  // Combined attendee table: merge across days
  const combinedAttendees = useMemo(() => {
    const map = new Map<string, {
      email: string;
      day1: number; day2: number; day3: number;
      totalMinutes: number;
      bestScore: string;
      daysAttended: number;
    }>();

    days.forEach((d) => {
      d.attendees.forEach((a) => {
        const email = a.guestEmail.toLowerCase();
        const existing = map.get(email) || {
          email: a.guestEmail,
          day1: 0, day2: 0, day3: 0,
          totalMinutes: 0,
          bestScore: "no show",
          daysAttended: 0,
        };
        if (d.day === 1) existing.day1 = a.watchTimeMinutes;
        if (d.day === 2) existing.day2 = a.watchTimeMinutes;
        if (d.day === 3) existing.day3 = a.watchTimeMinutes;
        existing.totalMinutes += a.watchTimeMinutes;
        existing.daysAttended = (existing.day1 > 0 ? 1 : 0) + (existing.day2 > 0 ? 1 : 0) + (existing.day3 > 0 ? 1 : 0);

        const current = classifyScore(a.leadScore);
        const currentOrder = LEAD_SCORE_MAP[current]?.order ?? 99;
        const bestOrder = LEAD_SCORE_MAP[existing.bestScore]?.order ?? 99;
        if (currentOrder < bestOrder) existing.bestScore = current;

        map.set(email, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [days]);

  // Filtered combined attendees
  const filteredAttendees = useMemo(() => {
    let list = combinedAttendees;
    if (dayFilter !== "all") {
      const dayNum = parseInt(dayFilter);
      list = list.filter((a) => {
        if (dayNum === 1) return a.day1 > 0;
        if (dayNum === 2) return a.day2 > 0;
        if (dayNum === 3) return a.day3 > 0;
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.email.toLowerCase().includes(q));
    }
    return list;
  }, [combinedAttendees, search, dayFilter]);

  // Lead score distribution by day for stacked chart
  const leadScoreByDay = useMemo(() => {
    return dayStats.map((d) => ({
      day: d.label,
      hot: d.scores["hot"] || 0,
      warm: d.scores["warm"] || 0,
      bounced: d.scores["bounced"] || 0,
      "no show": d.scores["no show"] || 0,
    }));
  }, [dayStats]);

  // Total watch time across all days
  const grandTotalMinutes = dayStats.reduce((s, d) => s + d.totalMinutes, 0);
  const grandAvgMinutes = totalUniqueAttendees > 0 ? grandTotalMinutes / totalUniqueAttendees : 0;
  const hotLeadCount = overallScores.find((s) => s.key === "hot")?.count || 0;
  const day1to3Retention = retentionData.length >= 3 && retentionData[0].total > 0
    ? ((retentionData[2].retained / retentionData[0].total) * 100).toFixed(1)
    : "—";

  const scoreStyleMap: Record<string, string> = {
    hot: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    warm: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    bounced: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
    "no show": "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30",
  };

  if (days.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No attendance data available
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top-Level KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {[
          { label: "Unique Attendees", value: formatNumber(totalUniqueAttendees), icon: Users, color: "text-foreground" },
          { label: "Day 1", value: formatNumber(dayStats[0]?.total || 0), icon: Users, color: "text-blue-600 dark:text-blue-400" },
          { label: "Day 2", value: formatNumber(dayStats[1]?.total || 0), icon: Users, color: "text-violet-600 dark:text-violet-400" },
          { label: "Day 3", value: formatNumber(dayStats[2]?.total || 0), icon: Users, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Hot Leads", value: formatNumber(hotLeadCount), icon: Flame, color: "text-red-600 dark:text-red-400" },
          { label: "Day 1→3 Retention", value: day1to3Retention === "—" ? "—" : `${day1to3Retention}%`, icon: TrendingDown, color: "text-amber-600 dark:text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5">
                <stat.icon className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
              <p className={`font-tabular mt-1 text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Watch Time Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Total Watch Time", value: formatDuration(grandTotalMinutes), color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Avg Watch Time / Person", value: formatDuration(grandAvgMinutes), color: "text-amber-600 dark:text-amber-400" },
          { label: "Avg Day 1 Duration", value: formatDuration(dayStats[0]?.avgMinutes || 0), color: "text-blue-600 dark:text-blue-400" },
          { label: "Avg Day 3 Duration", value: formatDuration(dayStats[2]?.avgMinutes || 0), color: "text-violet-600 dark:text-violet-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
              <p className={`font-tabular mt-1 text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Attendance by Day + Retention Funnel */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Attendance by Day Bar Chart */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Attendance by Day</CardTitle>
            <CardDescription>Number of attendees per challenge day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={attendanceByDayConfig} className="h-[260px] w-full">
              <BarChart
                data={dayStats.map((d, i) => ({ day: d.label, attendees: d.total, fill: DAY_COLORS[i] }))}
                accessibilityLayer
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="attendees" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  {dayStats.map((_, i) => (
                    <Cell key={i} fill={DAY_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            {/* Drop-off indicators */}
            {dayStats.length >= 2 && (
              <div className="mt-3 flex items-center justify-center gap-6">
                {dayStats.slice(1).map((d, i) => {
                  const prev = dayStats[i];
                  const drop = prev.total > 0 ? (((prev.total - d.total) / prev.total) * 100).toFixed(1) : "0";
                  return (
                    <span key={d.label} className="text-xs text-muted-foreground">
                      {prev.label} → {d.label}: <span className="font-semibold text-destructive">-{drop}%</span>
                    </span>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day 1 Retention Funnel */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Day 1 Retention</CardTitle>
            <CardDescription>How many Day 1 attendees returned on subsequent days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              {retentionData.map((r, i) => {
                const widthPct = Math.max(r.rate, 8);
                return (
                  <div key={r.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{r.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{r.retained} of {retentionData[0]?.total || 0}</span>
                        <span className="font-tabular font-bold">{r.rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-10 w-full overflow-hidden rounded-md bg-muted/30">
                      <div
                        className="flex h-full items-center justify-end rounded-md px-3 text-xs font-semibold transition-all duration-700"
                        style={{ width: `${widthPct}%`, backgroundColor: DAY_COLORS[i], color: "var(--background)" }}
                      >
                        {r.rate.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {retentionData.length >= 3 && retentionData[0].total > 0 && (
              <div className="mt-4 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">3-Day Stick Rate</p>
                <p className="font-tabular mt-0.5 text-xl font-bold text-primary">
                  {((retentionData[2].retained / retentionData[0].total) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Lead Score by Day + Overall Lead Score Donut */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Lead Score Distribution by Day - Stacked Bar */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Score by Day</CardTitle>
            <CardDescription>Engagement quality distribution across each day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={leadScoreConfig} className="h-[280px] w-full">
              <BarChart data={leadScoreByDay} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hot" stackId="a" fill="var(--chart-1)" radius={[0, 0, 0, 0]} maxBarSize={80} />
                <Bar dataKey="warm" stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} maxBarSize={80} />
                <Bar dataKey="bounced" stackId="a" fill="var(--chart-4)" radius={[0, 0, 0, 0]} maxBarSize={80} />
                <Bar dataKey="no show" stackId="a" fill="var(--chart-5)" radius={[6, 6, 0, 0]} maxBarSize={80} />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
              {Object.entries(LEAD_SCORE_MAP).map(([key, { label, color }]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overall Lead Score Donut */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Overall Lead Quality</CardTitle>
            <CardDescription>Aggregated engagement score across all 3 days</CardDescription>
          </CardHeader>
          <CardContent>
            {overallScores.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-muted-foreground">No data</div>
            ) : (
              <ChartContainer config={overallScoreConfig} className="mx-auto aspect-square max-h-[240px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" indicator="dot" />} />
                  <Pie
                    data={overallScores}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={95}
                    strokeWidth={2}
                    stroke="var(--background)"
                    paddingAngle={2}
                  >
                    {overallScores.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                {formatNumber(overallScoreTotal)}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                                Total Entries
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            {overallScores.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {overallScores.map((score) => {
                  const pct = overallScoreTotal > 0 ? ((score.count / overallScoreTotal) * 100).toFixed(1) : "0";
                  return (
                    <div key={score.key} className="flex items-center gap-2 text-sm">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: score.fill }} />
                      <span className="text-muted-foreground">{score.label}</span>
                      <span className="font-tabular ml-auto shrink-0 font-medium">{pct}%</span>
                      <span className="font-tabular w-10 shrink-0 text-right text-xs text-muted-foreground">{score.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Combined Attendee Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Attendee Directory</CardTitle>
              <CardDescription>
                {filteredAttendees.length} of {combinedAttendees.length} unique attendees across all days
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 xs:flex-row xs:flex-wrap xs:items-center">
              <div className="relative w-full xs:w-auto">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring xs:w-[200px]"
                />
              </div>
              <div className="flex gap-1">
                {["all", "1", "2", "3"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDayFilter(d)}
                    className={`h-8 flex-1 rounded-md px-2 text-xs font-medium transition-colors xs:flex-none xs:px-3 ${
                      dayFilter === d
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {d === "all" ? "All" : `Day ${d}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-auto rounded-md border border-border/30">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="min-w-[140px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Days</TableHead>
                  <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Day 1</TableHead>
                  <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Day 2</TableHead>
                  <TableHead className="hidden text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Day 3</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      {search || dayFilter !== "all" ? "No matching attendees" : "No attendance data"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.email} className="border-border/20 transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{attendee.email}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-tabular text-sm font-bold text-foreground">{attendee.daysAttended}/3</span>
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell">
                        <span className={`inline-flex items-center gap-1 font-tabular text-sm ${attendee.day1 > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>
                          <Clock className="h-3 w-3" />
                          {attendee.day1 > 0 ? formatDuration(attendee.day1) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell">
                        <span className={`inline-flex items-center gap-1 font-tabular text-sm ${attendee.day2 > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>
                          <Clock className="h-3 w-3" />
                          {attendee.day2 > 0 ? formatDuration(attendee.day2) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-center sm:table-cell">
                        <span className={`inline-flex items-center gap-1 font-tabular text-sm ${attendee.day3 > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>
                          <Clock className="h-3 w-3" />
                          {attendee.day3 > 0 ? formatDuration(attendee.day3) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-tabular text-sm font-bold text-foreground">
                          {formatDuration(attendee.totalMinutes)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${scoreStyleMap[attendee.bestScore] || "bg-muted text-muted-foreground border-border"}`}
                        >
                          {LEAD_SCORE_MAP[attendee.bestScore]?.label || attendee.bestScore}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
