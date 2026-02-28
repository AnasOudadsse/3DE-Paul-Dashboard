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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, Label, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Phone, Search } from "lucide-react";
import type { LeadTierData, PriorityContact, ObstacleData } from "@/lib/types";

interface SurveyAnalysisProps {
  pipelineQuality: LeadTierData[];
  priorityCallList: PriorityContact[];
  audiencePainPoints: ObstacleData[];
}

const chartConfig: ChartConfig = {
  tierA: { label: "Tier A — Hot", color: "var(--tier-a)" },
  tierB: { label: "Tier B — Warm", color: "var(--tier-b)" },
  tierC: { label: "Tier C — Cool", color: "var(--tier-c)" },
  tierD: { label: "Tier D — Cold", color: "var(--tier-d)" },
};

const painPointConfig: ChartConfig = {
  count: { label: "Responses", color: "var(--chart-3)" },
};

const obstacleColors = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)", "var(--tier-a)",
  "var(--tier-b)", "var(--tier-c)",
];

const tierBadgeStyles: Record<string, string> = {
  "Tier A": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "Tier B": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "Tier C": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Tier D": "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
};

export function SurveyAnalysis({
  pipelineQuality,
  priorityCallList,
  audiencePainPoints,
}: SurveyAnalysisProps) {
  const [tierFilter, setTierFilter] = useState("all");
  const [callSearch, setCallSearch] = useState("");
  const totalLeads = pipelineQuality.reduce((sum, d) => sum + d.count, 0);

  const filteredCallList = useMemo(() => {
    let list = priorityCallList;
    if (tierFilter !== "all") list = list.filter((c) => c.leadTier === tierFilter);
    if (callSearch.trim()) {
      const q = callSearch.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return list;
  }, [priorityCallList, tierFilter, callSearch]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Pipeline Quality Donut */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pipeline Quality</CardTitle>
            <CardDescription>Lead distribution by survey tier</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineQuality.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No survey data available</div>
            ) : (
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent labelKey="tier" nameKey="tier" indicator="dot" />} />
                  <Pie data={pipelineQuality} dataKey="count" nameKey="tier" innerRadius={70} outerRadius={110} strokeWidth={2} stroke="var(--background)" paddingAngle={2}>
                    {pipelineQuality.map((entry) => (<Cell key={entry.tier} fill={entry.fill} />))}
                    <Label content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">{totalLeads}</tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-muted-foreground text-xs">Total Leads</tspan>
                          </text>
                        );
                      }
                    }} />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pipelineQuality.map((entry) => (
                <div key={entry.tier} className="flex items-center gap-2 text-sm">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-muted-foreground">{entry.tier}</span>
                  <span className="font-tabular ml-auto font-medium">{totalLeads > 0 ? ((entry.count / totalLeads) * 100).toFixed(1) : "0"}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Call List */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Top Priority Call List</CardTitle>
                <CardDescription>{filteredCallList.length} leads &mdash; sorted by qualification score</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search name, email, phone..." value={callSearch} onChange={(e) => setCallSearch(e.target.value)}
                    className="h-8 w-[200px] rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring" />
                </div>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Tier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="Tier A">Tier A</SelectItem>
                    <SelectItem value="Tier B">Tier B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto rounded-md border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCallList.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{callSearch || tierFilter !== "all" ? "No matching leads" : "No priority leads found"}</TableCell></TableRow>
                  ) : filteredCallList.map((contact, i) => (
                    <TableRow key={`${contact.email}-${i}`} className="border-border/20 transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell><span className="inline-flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" />{contact.phone}</span></TableCell>
                      <TableCell className="text-center"><span className="font-tabular text-sm font-bold text-foreground">{contact.totalScore}</span></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${tierBadgeStyles[contact.leadTier] || tierBadgeStyles["Tier D"]}`}>{contact.leadTier}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience Pain Points */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Audience Pain Points</CardTitle>
          <CardDescription>Survey responses grouped by biggest obstacle</CardDescription>
        </CardHeader>
        <CardContent>
          {audiencePainPoints.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No survey data available</div>
          ) : (
            <ChartContainer config={painPointConfig} className="h-[320px] w-full">
              <BarChart data={audiencePainPoints} layout="vertical" accessibilityLayer>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <YAxis dataKey="obstacle" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={160} tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + "..." : v} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {audiencePainPoints.map((entry, idx) => (
                    <Cell key={entry.obstacle} fill={obstacleColors[idx % obstacleColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
