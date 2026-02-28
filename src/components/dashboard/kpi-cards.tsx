"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Landmark, ShoppingCart, TrendingUp } from "lucide-react";
import type { KPIData } from "@/lib/types";

interface KPICardsProps {
  data: KPIData;
}

const kpiConfig = [
  {
    key: "depositRevenue" as const,
    label: "Deposit Revenue",
    icon: Landmark,
    format: formatCurrency,
    accent: "text-emerald-600 dark:text-emerald-400",
    bgAccent: "bg-emerald-500/10 dark:bg-emerald-400/10",
    borderAccent: "border-emerald-500/20 dark:border-emerald-400/20",
  },
  {
    key: "productRevenue" as const,
    label: "Product Revenue",
    icon: ShoppingCart,
    format: formatCurrency,
    accent: "text-violet-600 dark:text-violet-400",
    bgAccent: "bg-violet-500/10 dark:bg-violet-400/10",
    borderAccent: "border-violet-500/20 dark:border-violet-400/20",
  },
  {
    key: "totalRevenue" as const,
    label: "Total Revenue",
    icon: TrendingUp,
    format: formatCurrency,
    accent: "text-amber-600 dark:text-amber-400",
    bgAccent: "bg-amber-500/10 dark:bg-amber-400/10",
    borderAccent: "border-amber-500/20 dark:border-amber-400/20",
  },
];

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 xs:grid-cols-3 sm:gap-4">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.key}
            className={`relative overflow-hidden border ${kpi.borderAccent} bg-card/80 backdrop-blur-sm`}
          >
            <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${kpi.bgAccent}`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${kpi.accent}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
                  {kpi.label}
                </p>
                <p className="font-tabular mt-0.5 text-xl font-bold tracking-tight text-foreground sm:mt-1 sm:text-2xl">
                  {kpi.format(data[kpi.key])}
                </p>
              </div>
            </CardContent>
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${kpi.bgAccent} opacity-40 blur-2xl`} />
          </Card>
        );
      })}
    </div>
  );
}
