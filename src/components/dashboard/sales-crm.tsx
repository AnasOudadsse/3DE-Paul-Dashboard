"use client";

import { useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  SalesVelocityPoint,
  ProductPerformance,
  CollectionContact,
  DepositRecord,
} from "@/lib/types";

interface SalesCrmProps {
  salesVelocity: SalesVelocityPoint[];
  topProducts: ProductPerformance[];
  collectionList: CollectionContact[];
  deposits: DepositRecord[];
}

const velocityConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
};

const productsConfig: ChartConfig = {
  count: { label: "Units Sold", color: "var(--chart-2)" },
};

const depositBadgeStyles: Record<string, string> = {
  Deposit: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "Remaining Balance": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  Refund: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
};

export function SalesCrm({
  salesVelocity,
  topProducts,
  collectionList,
  deposits,
}: SalesCrmProps) {
  const [depositTypeFilter, setDepositTypeFilter] = useState("all");
  const [collectionSearch, setCollectionSearch] = useState("");

  const velocityData = salesVelocity.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const depositTypes = useMemo(() => {
    const types = new Set(deposits.map((d) => d.type));
    return Array.from(types).sort();
  }, [deposits]);

  const filteredDeposits = useMemo(() => {
    if (depositTypeFilter === "all") return deposits;
    return deposits.filter((d) => d.type === depositTypeFilter);
  }, [deposits, depositTypeFilter]);

  const filteredCollection = useMemo(() => {
    if (!collectionSearch.trim()) return collectionList;
    const q = collectionSearch.toLowerCase();
    return collectionList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [collectionList, collectionSearch]);

  const depositTotal = filteredDeposits.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Velocity */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Sales Velocity
            </CardTitle>
            <CardDescription>Revenue over time by purchase date</CardDescription>
          </CardHeader>
          <CardContent>
            {salesVelocity.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No sales data available
              </div>
            ) : (
              <ChartContainer config={velocityConfig} className="h-[280px] w-full">
                <AreaChart data={velocityData} accessibilityLayer>
                  <defs>
                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${v}`} width={55} />
                  <ChartTooltip content={<ChartTooltipContent labelKey="date" indicator="line" />} />
                  <Area dataKey="revenue" type="monotone" fill="url(#velocityGradient)" stroke="var(--color-revenue)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Top Products
            </CardTitle>
            <CardDescription>Sales count by product</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No product data available
              </div>
            ) : (
              <ChartContainer config={productsConfig} className="h-[280px] w-full">
                <BarChart data={topProducts} layout="vertical" accessibilityLayer>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                  <YAxis dataKey="product" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={120} tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 16) + "..." : v)} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} maxBarSize={28} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deposits Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Deposits Ledger
              </CardTitle>
              <CardDescription>
                All deposit transactions &mdash; {filteredDeposits.length} records totaling{" "}
                <span className="font-semibold text-foreground">{formatCurrency(depositTotal)}</span>
              </CardDescription>
            </div>
            <Select value={depositTypeFilter} onValueChange={setDepositTypeFilter}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {depositTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[350px] overflow-auto rounded-md border border-border/30">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No deposits found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeposits.map((dep, i) => (
                    <TableRow key={`dep-${i}`} className="border-border/20 transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{dep.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-semibold ${depositBadgeStyles[dep.type] || "bg-muted text-muted-foreground"}`}>
                          {dep.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dep.date
                          ? new Date(dep.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-tabular font-semibold ${dep.type === "Refund" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {dep.type === "Refund" ? "-" : ""}
                          {formatCurrency(dep.amount)}
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

      {/* Collection List */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                The Collection List
              </CardTitle>
              <CardDescription>
                Contacts with outstanding balances &mdash; sorted highest to lowest
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
                className="h-8 w-[240px] rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              />
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollection.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      {collectionSearch ? "No matching contacts" : "No outstanding balances"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCollection.map((contact, i) => (
                    <TableRow key={`${contact.email}-${i}`} className="border-border/20 transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.email}</TableCell>
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
