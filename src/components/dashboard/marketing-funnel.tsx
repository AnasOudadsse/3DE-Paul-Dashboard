"use client";

import { useMemo } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis,
  Cell, Pie, PieChart, Label,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import type {
  FunnelStep, UTMCampaignData, CampaignActionData, BuyerAttributionData,
} from "@/lib/types";

interface MarketingFunnelProps {
  upgradeFunnel: FunnelStep[];
  campaignActions?: CampaignActionData[];
  mediumBreakdown?: UTMCampaignData[];
  contentBreakdown?: UTMCampaignData[];
  termBreakdown?: UTMCampaignData[];
  buyerAttribution?: BuyerAttributionData[];
}

const mediumConfig: ChartConfig = {
  count: { label: "Actions", color: "var(--chart-1)" },
};

const contentConfig: ChartConfig = {
  count: { label: "Actions", color: "var(--chart-2)" },
};

const attributionConfig: ChartConfig = {
  productBuyers: { label: "Product Buyers", color: "var(--chart-1)" },
  depositBuyers: { label: "Deposit Buyers", color: "var(--chart-2)" },
};

export function MarketingFunnel({
  upgradeFunnel,
  campaignActions = [],
  mediumBreakdown = [],
  contentBreakdown = [],
  termBreakdown = [],
  buyerAttribution = [],
}: MarketingFunnelProps) {
  const funnelMax = upgradeFunnel[0]?.count || 1;
  const totalActions = useMemo(() => campaignActions.reduce((s, c) => s + c.total, 0), [campaignActions]);
  const mediumTotal = useMemo(() => mediumBreakdown.reduce((s, m) => s + m.count, 0), [mediumBreakdown]);
  const totalBuyers = useMemo(() => buyerAttribution.reduce((s, b) => s + b.totalBuyers, 0), [buyerAttribution]);
  const totalProductBuyers = useMemo(() => buyerAttribution.reduce((s, b) => s + b.productBuyers, 0), [buyerAttribution]);
  const totalDepositBuyers = useMemo(() => buyerAttribution.reduce((s, b) => s + b.depositBuyers, 0), [buyerAttribution]);

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Actions", value: formatNumber(totalActions), color: "text-foreground" },
          { label: "UTM Sources", value: formatNumber(mediumBreakdown.length), color: "text-blue-600 dark:text-blue-400" },
          { label: "Product Buyers", value: formatNumber(totalProductBuyers), color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Deposit Buyers", value: formatNumber(totalDepositBuyers), color: "text-violet-600 dark:text-violet-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/80">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className={`font-tabular mt-1 text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Upgrade Funnel + UTM Medium Donut */}
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
                return (
                  <div key={step.step} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{step.step}</span>
                      <span className="font-tabular font-bold">{formatNumber(step.count)}</span>
                    </div>
                    <div className="h-10 w-full overflow-hidden rounded-md bg-muted/30">
                      <div
                        className="flex h-full items-center justify-end rounded-md px-3 text-xs font-semibold transition-all duration-700"
                        style={{ width: `${widthPct}%`, backgroundColor: step.fill, color: "var(--background)" }}
                      >
                        {formatNumber(step.count)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* UTM Medium Distribution Donut */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Traffic Medium</CardTitle>
            <CardDescription>Distribution of actions by UTM medium</CardDescription>
          </CardHeader>
          <CardContent>
            {mediumBreakdown.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-muted-foreground">No UTM medium data</div>
            ) : (
              <ChartContainer config={mediumConfig} className="mx-auto aspect-square max-h-[240px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="campaign" indicator="dot" />} />
                  <Pie
                    data={mediumBreakdown}
                    dataKey="count"
                    nameKey="campaign"
                    innerRadius={55}
                    outerRadius={95}
                    strokeWidth={2}
                    stroke="var(--background)"
                    paddingAngle={2}
                  >
                    {mediumBreakdown.map((entry) => (
                      <Cell key={entry.campaign} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                {formatNumber(mediumTotal)}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                                Total
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
            {mediumBreakdown.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {mediumBreakdown.map((source) => {
                  const pct = mediumTotal > 0 ? ((source.count / mediumTotal) * 100).toFixed(1) : "0";
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

      {/* Row 2: Campaign × Action Performance Table */}
      {campaignActions.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Campaign Performance Matrix</CardTitle>
            <CardDescription>
              Action breakdown by UTM campaign &mdash; {campaignActions.length} campaigns, {formatNumber(totalActions)} total actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-auto rounded-md border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free Ticket</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">VIP Upgrade</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upsell</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zoom Reg</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conv %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignActions.map((row) => {
                    const convRate = row.freeTicket > 0 ? ((row.vipUpgrade / row.freeTicket) * 100).toFixed(1) : "—";
                    return (
                      <TableRow key={row.campaign} className="border-border/20 transition-colors hover:bg-muted/30">
                        <TableCell className="max-w-[200px] truncate font-medium">{row.campaign}</TableCell>
                        <TableCell className="text-center font-tabular">{row.freeTicket || "—"}</TableCell>
                        <TableCell className="text-center font-tabular">{row.vipUpgrade || "—"}</TableCell>
                        <TableCell className="text-center font-tabular">{row.upsell || "—"}</TableCell>
                        <TableCell className="text-center font-tabular">{row.zoomReg || "—"}</TableCell>
                        <TableCell className="text-center font-tabular font-bold text-foreground">{row.total}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-tabular text-sm font-semibold ${
                            convRate !== "—" && parseFloat(convRate) > 20
                              ? "text-emerald-600 dark:text-emerald-400"
                              : convRate !== "—" && parseFloat(convRate) > 10
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}>
                            {convRate === "—" ? "—" : `${convRate}%`}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 3: UTM Content + UTM Term */}
      {(contentBreakdown.length > 0 || termBreakdown.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* UTM Content */}
          {contentBreakdown.length > 0 && (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Top Content (UTM Content)</CardTitle>
                <CardDescription>Which ad creatives or content pieces drive the most actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={contentConfig} className="h-[260px] w-full">
                  <BarChart data={contentBreakdown} layout="vertical" accessibilityLayer>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <YAxis
                      dataKey="campaign"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={120}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {contentBreakdown.map((entry) => (
                        <Cell key={entry.campaign} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* UTM Term */}
          {termBreakdown.length > 0 && (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Top Keywords (UTM Term)</CardTitle>
                <CardDescription>Search terms or keywords driving registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={contentConfig} className="h-[260px] w-full">
                  <BarChart data={termBreakdown} layout="vertical" accessibilityLayer>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <YAxis
                      dataKey="campaign"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={120}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
                    />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {termBreakdown.map((entry) => (
                        <Cell key={entry.campaign} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Row 4: Buyer Attribution */}
      {buyerAttribution.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue Attribution by Campaign</CardTitle>
            <CardDescription>
              Where your {formatNumber(totalBuyers)} product &amp; deposit buyers came from (first-touch UTM campaign)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={attributionConfig} className="h-[300px] w-full">
              <BarChart data={buyerAttribution.slice(0, 10)} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="campaign"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="productBuyers" name="Product Buyers" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="depositBuyers" name="Deposit Buyers" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                Product Buyers
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
                Deposit Buyers
              </div>
            </div>

            {/* Attribution Table */}
            <div className="mt-4 max-h-[320px] overflow-auto rounded-md border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Buyers</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deposit Buyers</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">% of All</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyerAttribution.map((row) => {
                    const pct = totalBuyers > 0 ? ((row.totalBuyers / totalBuyers) * 100).toFixed(1) : "0";
                    return (
                      <TableRow key={row.campaign} className="border-border/20 transition-colors hover:bg-muted/30">
                        <TableCell className="max-w-[200px] truncate font-medium">{row.campaign}</TableCell>
                        <TableCell className="text-center font-tabular">
                          <span className="text-emerald-600 dark:text-emerald-400">{row.productBuyers || "—"}</span>
                        </TableCell>
                        <TableCell className="text-center font-tabular">
                          <span className="text-violet-600 dark:text-violet-400">{row.depositBuyers || "—"}</span>
                        </TableCell>
                        <TableCell className="text-center font-tabular font-bold text-foreground">{row.totalBuyers}</TableCell>
                        <TableCell className="text-center font-tabular text-sm text-muted-foreground">{pct}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
