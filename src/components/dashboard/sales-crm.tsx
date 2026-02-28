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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type {
  SalesVelocityPoint,
  ProductPerformance,
  CollectionContact,
} from "@/lib/types";

interface SalesCrmProps {
  salesVelocity: SalesVelocityPoint[];
  topProducts: ProductPerformance[];
  collectionList: CollectionContact[];
}

const velocityConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
};

const productsConfig: ChartConfig = {
  count: {
    label: "Units Sold",
    color: "var(--chart-2)",
  },
};

export function SalesCrm({
  salesVelocity,
  topProducts,
  collectionList,
}: SalesCrmProps) {
  const velocityData = salesVelocity.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Velocity */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Sales Velocity
            </CardTitle>
            <CardDescription>Revenue over time by purchase date</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={velocityConfig} className="h-[280px] w-full">
              <AreaChart data={velocityData} accessibilityLayer>
                <defs>
                  <linearGradient
                    id="velocityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={50}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelKey="date"
                      indicator="line"
                    />
                  }
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#velocityGradient)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Top Products
            </CardTitle>
            <CardDescription>Sales count by product</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={productsConfig} className="h-[280px] w-full">
              <BarChart
                data={topProducts}
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
                  dataKey="product"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  width={120}
                  tickFormatter={(v: string) =>
                    v.length > 16 ? v.slice(0, 16) + "..." : v
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
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Collection List */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            The Collection List
          </CardTitle>
          <CardDescription>
            Contacts with outstanding balances — sorted highest to lowest
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Balance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No outstanding balances
                    </TableCell>
                  </TableRow>
                ) : (
                  collectionList.map((contact, i) => (
                    <TableRow
                      key={`${contact.email}-${i}`}
                      className="border-border/20 transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.phone}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.email}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-tabular font-semibold text-amber-600 dark:text-amber-400">
                          {formatCurrency(contact.balance)}
                        </span>
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
