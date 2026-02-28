"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICards } from "./kpi-cards";
import { SurveyAnalysis } from "./executive-summary";
import { SalesCrm } from "./sales-crm";
import { MarketingFunnel } from "./marketing-funnel";
import { ContactsTab } from "./contacts-tab";
import { AttendanceTab } from "./attendance-tab";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClipboardList, DollarSign, Rocket, Users, CalendarCheck, RefreshCw } from "lucide-react";
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
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
              3-Day CRE Challenge
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Executive Dashboard</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <RefreshCw className="h-3 w-3" />
              Updated {lastUpdated}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <KPICards data={data.kpis} />
        </div>

        <Tabs defaultValue="contacts" className="space-y-4 sm:space-y-6">
          <div className="-mx-3 overflow-x-auto px-3 sm:-mx-0 sm:px-0">
            <TabsList className="inline-flex h-10 w-max items-center gap-1 rounded-xl border border-border/40 bg-muted/30 p-1 backdrop-blur-sm">
              <TabsTrigger
                value="contacts"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Users className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Contacts</span>
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Sales</span>
              </TabsTrigger>
              <TabsTrigger
                value="marketing"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Rocket className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Marketing</span>
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Attendance</span>
              </TabsTrigger>
              <TabsTrigger
                value="survey"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-3 sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Survey</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contacts" className="mt-4 sm:mt-6">
            <ContactsTab contacts={data.contacts} />
          </TabsContent>

          <TabsContent value="sales" className="mt-4 sm:mt-6">
            <SalesCrm
              salesVelocity={data.salesVelocity}
              topProducts={data.topProducts}
              collectionList={data.collectionList}
              deposits={data.deposits}
            />
          </TabsContent>

          <TabsContent value="marketing" className="mt-4 sm:mt-6">
            <MarketingFunnel
              upgradeFunnel={data.upgradeFunnel}
              campaignActions={data.campaignActions}
              mediumBreakdown={data.mediumBreakdown}
              contentBreakdown={data.contentBreakdown}
              termBreakdown={data.termBreakdown}
              buyerAttribution={data.buyerAttribution}
            />
          </TabsContent>

          <TabsContent value="attendance" className="mt-4 sm:mt-6">
            <AttendanceTab attendanceLogs={data.attendanceLogs} dayAttendance={data.dayAttendance} />
          </TabsContent>

          <TabsContent value="survey" className="mt-4 sm:mt-6">
            <SurveyAnalysis
              pipelineQuality={data.pipelineQuality}
              priorityCallList={data.priorityCallList}
              audiencePainPoints={data.audiencePainPoints}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-8 border-t border-border/30 py-4 sm:mt-12 sm:py-6">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6" />
      </footer>
    </div>
  );
}
