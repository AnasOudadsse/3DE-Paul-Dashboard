"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import type { FunnelStep, UTMCampaignData, ObstacleData } from "@/lib/types";

interface MarketingFunnelProps {
  upgradeFunnel: FunnelStep[];
  trafficSources: UTMCampaignData[];
  audiencePainPoints: ObstacleData[];
}

const trafficConfig: ChartConfig = {
  count: { label: "VIP Upgrades", color: "var(--chart-1)" },
};

const painPointConfig: ChartConfig = {
  count: { label: "Responses", color: "var(--chart-3)" },
};

const obstacleColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--tier-a)",
  "var(--tier-b)",
  "var(--tier-c)",
];

export function MarketingFunnel({
  upgradeFunnel,
  trafficSources,
  audiencePainPoints,
}: MarketingFunnelProps) {
  const funnelMax = upgradeFunnel[0]?.count || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upgrade Funnel */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              The Upgrade Funnel
            </CardTitle>
            <CardDescription>
              Drop-off from free ticket to zoom registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              {upgradeFunnel.map((step, i) => {
                const widthPct = Math.max(
                  (step.count / funnelMax) * 100,
                  8
                );
                const dropoff =
                  i > 0
                    ? (
                        ((upgradeFunnel[i - 1].count - step.count) /
                          upgradeFunnel[i - 1].count) *
                        100
                      ).toFixed(1)
                    : null;
                return (
                  <div key={step.step} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {step.step}
                      </span>
                      <div className="flex items-center gap-3">
                        {dropoff && (
                          <span className="text-xs text-destructive">
                            -{dropoff}%
                          </span>
                        )}
                        <span className="font-tabular font-bold">
                          {formatNumber(step.count)}
                        </span>
                      </div>
                    </div>
                    <div className="h-10 w-full overflow-hidden rounded-md bg-muted/30">
                      <div
                        className="flex h-full items-center justify-end rounded-md px-3 text-xs font-semibold transition-all duration-700"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: step.fill,
                          color: "var(--background)",
                        }}
                      >
                        {((step.count / funnelMax) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {upgradeFunnel.length >= 2 && (
              <div className="mt-4 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Overall Conversion Rate
                </p>
                <p className="font-tabular mt-0.5 text-xl font-bold text-primary">
                  {(
                    (upgradeFunnel[upgradeFunnel.length - 1].count /
                      upgradeFunnel[0].count) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* High-Value Traffic */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              High-Value Traffic
            </CardTitle>
            <CardDescription>
              VIP upgrades grouped by UTM campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trafficSources.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                No UTM campaign data available
              </div>
            ) : (
              <ChartContainer
                config={trafficConfig}
                className="mx-auto aspect-square max-h-[280px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="campaign"
                        indicator="dot"
                      />
                    }
                  />
                  <Pie
                    data={trafficSources}
                    dataKey="count"
                    nameKey="campaign"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    strokeWidth={2}
                    stroke="var(--background)"
                    paddingAngle={1}
                  >
                    {trafficSources.map((entry) => (
                      <Cell key={entry.campaign} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            {trafficSources.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {trafficSources.slice(0, 5).map((source) => (
                  <div
                    key={source.campaign}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: source.fill }}
                    />
                    <span className="truncate text-muted-foreground">
                      {source.campaign}
                    </span>
                    <span className="font-tabular ml-auto font-medium">
                      {source.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audience Pain Points */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Audience Pain Points
          </CardTitle>
          <CardDescription>
            Survey responses grouped by biggest obstacle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={painPointConfig} className="h-[320px] w-full">
            <BarChart
              data={audiencePainPoints}
              layout="vertical"
              accessibilityLayer
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="var(--border)"
                strokeOpacity={0.5}
              />
              <YAxis
                dataKey="obstacle"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                width={160}
                tickFormatter={(v: string) =>
                  v.length > 22 ? v.slice(0, 22) + "..." : v
                }
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {audiencePainPoints.map((entry, idx) => (
                  <Cell
                    key={entry.obstacle}
                    fill={obstacleColors[idx % obstacleColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
