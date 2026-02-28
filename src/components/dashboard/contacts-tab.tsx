"use client";

import { useMemo, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ContactRecord } from "@/lib/types";

interface ContactsTabProps {
  contacts: ContactRecord[];
}

export function ContactsTab({ contacts }: ContactsTabProps) {
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<"all" | "with-balance" | "zero">("all");

  const filtered = useMemo(() => {
    let list = contacts;
    if (balanceFilter === "with-balance") list = list.filter((c) => c.totalBalance > 0);
    else if (balanceFilter === "zero") list = list.filter((c) => c.totalBalance === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }
    return list;
  }, [contacts, search, balanceFilter]);

  const totalDepositsSum = filtered.reduce((s, c) => s + c.totalDeposits, 0);
  const totalBalanceSum = filtered.reduce((s, c) => s + c.totalBalance, 0);

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Contacts", value: formatNumber(filtered.length), color: "text-foreground" },
          { label: "Total Deposits", value: formatCurrency(totalDepositsSum), color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Outstanding Balance", value: formatCurrency(totalBalanceSum), color: "text-amber-600 dark:text-amber-400" },
          { label: "With Balance", value: formatNumber(filtered.filter((c) => c.totalBalance > 0).length), color: "text-violet-600 dark:text-violet-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/80">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className={`font-tabular mt-1 text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contacts table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">All Contacts</CardTitle>
              <CardDescription>{filtered.length} of {contacts.length} contacts</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-[220px] rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex h-8 items-center rounded-md border border-border text-xs">
                {(["all", "with-balance", "zero"] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setBalanceFilter(val)}
                    className={`h-full px-3 transition-colors first:rounded-l-md last:rounded-r-md ${
                      balanceFilter === val
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {val === "all" ? "All" : val === "with-balance" ? "Has Balance" : "Paid Off"}
                  </button>
                ))}
              </div>
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deposits</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remaining</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {search ? "No matching contacts" : "No contacts found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c, i) => (
                    <TableRow key={`${c.email}-${i}`} className="border-border/20 transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-tabular text-emerald-600 dark:text-emerald-400">{c.totalDeposits > 0 ? formatCurrency(c.totalDeposits) : "—"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-tabular text-muted-foreground">{c.totalRemaining > 0 ? formatCurrency(c.totalRemaining) : "—"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-tabular font-semibold ${c.totalBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                          {c.totalBalance > 0 ? formatCurrency(c.totalBalance) : "$0"}
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
