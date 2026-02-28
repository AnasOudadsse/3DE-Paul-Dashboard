"use client";

import { useMemo } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart, Label } from "recharts";
import { formatNumber } from "@/lib/utils";
import type { FunnelStep, UTMCampaignData } from "@/lib/types";

interface MarketingFunnelProps {
  upgradeFunnel: FunnelStep[];
  actionSources: UTMCampaignData[];
  trafficSources: UTMCampaignData[];
}

const trafficConfig: ChartConfig = {
  count: { label: "VIP Upgrades", color: "var(--chart-1)" },
};

const actionConfig: ChartConfig = {
  count: { label: "Actions", color: "var(--chart-2)" },
};

export function MarketingFunnel({
  upgradeFunnel,
  actionSources,
  trafficSources,
}: MarketingFunnelProps) {
  const funnelMax = upgradeFunnel[0]?.count || 1;
  const actionTotal = useMemo(() => actionSources.reduce((s, a) => s + a.count, 0), [actionSources]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upgrade Funnel */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">The Upgrade Funnel</CardTitle>
            <CardDescription>Drop-off: Free Ticket &rarr; VIP Upgrade &rarr; Upsell Purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              {upgradeFunnel.map((step, i) => {
                const widthPct = Math.max((step.count / funnelMax) * 100, 8);
                const dropoff = i > 0 && upgradeFunnel[i - 1].count > 0
                  ? (((upgradeFunnel[i - 1].count - step.count) / upgradeFunnel[i - 1].count) * 100).toFixed(1)
                  : null;
                return (
                  <div key={step.step} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{step.step}</span>
                      <div className="flex items-center gap-3">
                        {dropoff && <span className="text-xs text-destructive">-{dropoff}%</span>}
                        <span className="font-tabular font-bold">{formatNumber(step.count)}</span>
                      </div>
                    </div>
                    <div className="h-10 w-full overflow-hidden rounded-md bg-muted/30">
                      <div
                        className="flex h-full items-center justify-end rounded-md px-3 text-xs font-semibold transition-all duration-700"
                        style={{ width: `${widthPct}%`, backgroundColor: step.fill, color: "var(--background)" }}
                      >
                        {((step.count / funnelMax) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {upgradeFunnel.length >= 2 && upgradeFunnel[0].count > 0 && (
              <div className="mt-4 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">Overall Conversion Rate</p>
                <p className="font-tabular mt-0.5 text-xl font-bold text-primary">
                  {((upgradeFunnel[upgradeFunnel.length - 1].count / upgradeFunnel[0].count) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Source Distribution */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Action Source Breakdown</CardTitle>
            <CardDescription>Distribution of all action types with percentages</CardDescription>
          </CardHeader>
          <CardContent>
            {actionSources.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">No action data available</div>
            ) : (
              <ChartContainer config={actionConfig} className="mx-auto aspect-square max-h-[260px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="campaign" indicator="dot" />} />
                  <Pie
                    data={actionSources}
                    dataKey="count"
                    nameKey="campaign"
                    innerRadius={60}
                    outerRadius={100}
                    strokeWidth={2}
                    stroke="var(--background)"
                    paddingAngle={2}
                  >
                    {actionSources.map((entry) => (
                      <Cell key={entry.campaign} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                {formatNumber(actionTotal)}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                                Total Actions
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
            {actionSources.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {actionSources.map((source) => {
                  const pct = actionTotal > 0 ? ((source.count / actionTotal) * 100).toFixed(1) : "0";
                  return (
                    <div key={source.campaign} className="flex items-center gap-2 text-sm">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: source.fill }} />
                      <span className="truncate text-muted-foreground">{source.campaign}</span>
                      <span className="font-tabular ml-auto shrink-0 font-medium">{pct}%</span>
                      <span className="font-tabular w-10 shrink-0 text-right text-xs text-muted-foreground">{source.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High-Value Traffic */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">High-Value Traffic</CardTitle>
          <CardDescription>VIP upgrades grouped by UTM campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              {trafficSources.length === 0 ? (
                <div className="flex h-[240px] items-center justify-center text-muted-foreground">No UTM campaign data available</div>
              ) : (
                <ChartContainer config={trafficConfig} className="mx-auto aspect-square max-h-[240px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="campaign" indicator="dot" />} />
                    <Pie data={trafficSources} dataKey="count" nameKey="campaign" cx="50%" cy="50%" outerRadius={95} strokeWidth={2} stroke="var(--background)" paddingAngle={1}>
                      {trafficSources.map((entry) => (<Cell key={entry.campaign} fill={entry.fill} />))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </div>
            {trafficSources.length > 0 && (
              <div className="flex flex-col justify-center space-y-2">
                {trafficSources.map((source) => {
                  const total = trafficSources.reduce((s, t) => s + t.count, 0);
                  const pct = total > 0 ? ((source.count / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={source.campaign} className="flex items-center gap-2 text-sm">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: source.fill }} />
                      <span className="truncate text-muted-foreground">{source.campaign}</span>
                      <span className="font-tabular ml-auto shrink-0 font-medium">{pct}%</span>
                      <span className="font-tabular w-8 shrink-0 text-right text-xs text-muted-foreground">{source.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
