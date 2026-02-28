"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, Label } from "recharts";
import { Phone } from "lucide-react";
import type { LeadTierData, PriorityContact } from "@/lib/types";

interface ExecutiveSummaryProps {
  pipelineQuality: LeadTierData[];
  priorityCallList: PriorityContact[];
}

const chartConfig: ChartConfig = {
  tierA: { label: "Tier A — Hot", color: "var(--tier-a)" },
  tierB: { label: "Tier B — Warm", color: "var(--tier-b)" },
  tierC: { label: "Tier C — Cool", color: "var(--tier-c)" },
  tierD: { label: "Tier D — Cold", color: "var(--tier-d)" },
};

const tierBadgeStyles: Record<string, string> = {
  "Tier A": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Tier B": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Tier C": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Tier D": "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export function ExecutiveSummary({
  pipelineQuality,
  priorityCallList,
}: ExecutiveSummaryProps) {
  const totalLeads = pipelineQuality.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Pipeline Quality Donut */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Pipeline Quality
            </CardTitle>
            <CardDescription>Lead distribution by survey tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[280px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelKey="tier"
                      nameKey="tier"
                      indicator="dot"
                    />
                  }
                />
                <Pie
                  data={pipelineQuality}
                  dataKey="count"
                  nameKey="tier"
                  innerRadius={70}
                  outerRadius={110}
                  strokeWidth={2}
                  stroke="var(--background)"
                  paddingAngle={2}
                >
                  {pipelineQuality.map((entry) => (
                    <Cell key={entry.tier} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalLeads}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 22}
                              className="fill-muted-foreground text-xs"
                            >
                              Total Leads
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pipelineQuality.map((entry) => {
                const pct =
                  totalLeads > 0
                    ? ((entry.count / totalLeads) * 100).toFixed(1)
                    : "0";
                return (
                  <div
                    key={entry.tier}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-muted-foreground">{entry.tier}</span>
                    <span className="font-tabular ml-auto font-medium">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Call List */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Top Priority Call List
            </CardTitle>
            <CardDescription>
              Tier A & B leads sorted by qualification score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto rounded-md border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Phone
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Score
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tier
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priorityCallList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No priority leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    priorityCallList.map((contact, i) => (
                      <TableRow
                        key={`${contact.email}-${i}`}
                        className="border-border/20 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">
                          {contact.name}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-tabular text-sm font-bold text-foreground">
                            {contact.totalScore}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${tierBadgeStyles[contact.leadTier] || tierBadgeStyles["Tier D"]}`}
                          >
                            {contact.leadTier}
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
    </div>
  );
}
