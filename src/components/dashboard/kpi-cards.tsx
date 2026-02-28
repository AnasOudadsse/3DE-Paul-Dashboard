"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import type { KPIData } from "@/lib/types";

interface KPICardsProps {
  data: KPIData;
}

const kpiConfig = [
  {
    key: "totalRevenue" as const,
    label: "Total Revenue Collected",
    icon: DollarSign,
    format: formatCurrency,
    accent: "text-emerald-600 dark:text-emerald-400",
    bgAccent: "bg-emerald-500/10 dark:bg-emerald-400/10",
    borderAccent: "border-emerald-500/20 dark:border-emerald-400/20",
  },
  {
    key: "outstandingPipeline" as const,
    label: "Outstanding Pipeline",
    icon: TrendingUp,
    format: formatCurrency,
    accent: "text-amber-600 dark:text-amber-400",
    bgAccent: "bg-amber-500/10 dark:bg-amber-400/10",
    borderAccent: "border-amber-500/20 dark:border-amber-400/20",
  },
  {
    key: "totalUpfrontSales" as const,
    label: "Total Upfront Sales",
    icon: ShoppingCart,
    format: formatNumber,
    accent: "text-violet-600 dark:text-violet-400",
    bgAccent: "bg-violet-500/10 dark:bg-violet-400/10",
    borderAccent: "border-violet-500/20 dark:border-violet-400/20",
  },
];

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.key}
            className={`relative overflow-hidden border ${kpi.borderAccent} bg-card/80 backdrop-blur-sm`}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kpi.bgAccent}`}
              >
                <Icon className={`h-5 w-5 ${kpi.accent}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="font-tabular mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {kpi.format(data[kpi.key])}
                </p>
              </div>
            </CardContent>
            <div
              className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${kpi.bgAccent} opacity-40 blur-2xl`}
            />
          </Card>
        );
      })}
    </div>
  );
}
