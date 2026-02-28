"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICards } from "./kpi-cards";
import { ExecutiveSummary } from "./executive-summary";
import { SalesCrm } from "./sales-crm";
import { MarketingFunnel } from "./marketing-funnel";
import { ThemeToggle } from "@/components/theme-toggle";
import { BarChart3, DollarSign, Rocket, RefreshCw } from "lucide-react";
import type { DashboardData } from "@/lib/types";

interface DashboardShellProps {
  data: DashboardData;
}

export function DashboardShell({ data }: DashboardShellProps) {
  const lastUpdated = new Date(data.lastUpdated).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              3-Day CRE Challenge
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Executive Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              Updated {lastUpdated}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {/* KPI Row */}
        <div className="mb-8">
          <KPICards data={data.kpis} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="executive" className="space-y-6">
          <TabsList className="inline-flex h-10 items-center gap-1 rounded-xl border border-border/40 bg-muted/30 p-1 backdrop-blur-sm">
            <TabsTrigger
              value="executive"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Executive Summary
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Sales & CRM
            </TabsTrigger>
            <TabsTrigger
              value="marketing"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Rocket className="h-3.5 w-3.5" />
              Marketing Funnel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="mt-6">
            <ExecutiveSummary
              pipelineQuality={data.pipelineQuality}
              priorityCallList={data.priorityCallList}
            />
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <SalesCrm
              salesVelocity={data.salesVelocity}
              topProducts={data.topProducts}
              collectionList={data.collectionList}
              deposits={data.deposits}
            />
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <MarketingFunnel
              upgradeFunnel={data.upgradeFunnel}
              trafficSources={data.trafficSources}
              audiencePainPoints={data.audiencePainPoints}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border/30 py-6">
        <div className="mx-auto max-w-[1400px] px-6">
          <p className="text-center text-xs text-muted-foreground/60">
            Data cached for 5 minutes &middot; Powered by Airtable &middot;
            Built for Walid
          </p>
        </div>
      </footer>
    </div>
  );
}
