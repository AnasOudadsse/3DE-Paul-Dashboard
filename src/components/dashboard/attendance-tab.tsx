"use client";

import { useMemo, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Clock } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { AttendanceRecord } from "@/lib/types";

interface AttendanceTabProps {
  attendanceLogs: AttendanceRecord[];
}

const engagementStyles: Record<string, string> = {
  "Live": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "Highly Engaged": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  "Replay": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Partial Attendance": "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
  "In-person": "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  "Virtual": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
};

function formatDuration(minutes: number): string {
  if (minutes < 1) return "<1m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function AttendanceTab({ attendanceLogs }: AttendanceTabProps) {
  const [search, setSearch] = useState("");
  const [engagementFilter, setEngagementFilter] = useState("all");

  const engagementTypes = useMemo(() => {
    const types = new Set(attendanceLogs.map((l) => l.engagementType).filter((t) => t !== "—"));
    return Array.from(types).sort();
  }, [attendanceLogs]);

  const filtered = useMemo(() => {
    let list = attendanceLogs;
    if (engagementFilter !== "all") list = list.filter((l) => l.engagementType === engagementFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) => l.guestName.toLowerCase().includes(q) || l.guestEmail.toLowerCase().includes(q)
      );
    }
    return list;
  }, [attendanceLogs, search, engagementFilter]);

  const totalMinutes = filtered.reduce((s, l) => s + l.durationMinutes, 0);
  const avgDuration = filtered.length > 0 ? totalMinutes / filtered.length : 0;
  const uniqueAttendees = new Set(filtered.map((l) => l.guestEmail.toLowerCase())).size;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Log Entries", value: formatNumber(filtered.length), color: "text-foreground" },
          { label: "Unique Attendees", value: formatNumber(uniqueAttendees), color: "text-violet-600 dark:text-violet-400" },
          { label: "Total Watch Time", value: formatDuration(totalMinutes), color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Avg Duration", value: formatDuration(avgDuration), color: "text-amber-600 dark:text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/80">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className={`font-tabular mt-1 text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Attendance Logs</CardTitle>
              <CardDescription>{filtered.length} of {attendanceLogs.length} entries</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-[200px] rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
              <Select value={engagementFilter} onValueChange={setEngagementFilter}>
                <SelectTrigger className="h-8 w-[170px] text-xs">
                  <SelectValue placeholder="Engagement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Engagement</SelectItem>
                  {engagementTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-auto rounded-md border border-border/30">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Join Time</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {search || engagementFilter !== "all" ? "No matching logs" : "No attendance data"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log, i) => (
                    <TableRow key={`${log.guestEmail}-${i}`} className="border-border/20 transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{log.guestName}</TableCell>
                      <TableCell className="text-muted-foreground">{log.guestEmail}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.joinTime
                          ? new Date(log.joinTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 font-tabular text-sm text-foreground">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDuration(log.durationMinutes)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${engagementStyles[log.engagementType] || "bg-muted text-muted-foreground border-border"}`}>
                          {log.engagementType}
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
  );
}
