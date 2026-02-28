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
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Total Contacts", value: formatNumber(filtered.length), color: "text-foreground" },
          { label: "Total Deposits", value: formatCurrency(totalDepositsSum), color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Outstanding Balance", value: formatCurrency(totalBalanceSum), color: "text-amber-600 dark:text-amber-400" },
          { label: "With Balance", value: formatNumber(filtered.filter((c) => c.totalBalance > 0).length), color: "text-violet-600 dark:text-violet-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/80">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[10px]">{stat.label}</p>
              <p className={`font-tabular mt-1 text-base font-bold sm:text-lg ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-base font-semibold">All Contacts</CardTitle>
              <CardDescription>{filtered.length} of {contacts.length} contacts</CardDescription>
            </div>
            <div className="flex flex-col gap-2 xs:flex-row xs:flex-wrap xs:items-center">
              <div className="relative w-full xs:w-auto">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring xs:w-[220px]"
                />
              </div>
              <div className="flex h-8 items-center rounded-md border border-border text-xs">
                {(["all", "with-balance", "zero"] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setBalanceFilter(val)}
                    className={`h-full flex-1 px-2 transition-colors first:rounded-l-md last:rounded-r-md xs:flex-none xs:px-3 ${
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
        <CardContent className="px-3 sm:px-6">
          <div className="max-h-[500px] overflow-auto rounded-md border border-border/30">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="min-w-[120px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                  <TableHead className="hidden min-w-[160px] text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Email</TableHead>
                  <TableHead className="hidden min-w-[100px] text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Phone</TableHead>
                  <TableHead className="min-w-[80px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deposits</TableHead>
                  <TableHead className="hidden min-w-[80px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Remaining</TableHead>
                  <TableHead className="min-w-[80px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance</TableHead>
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
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{c.email}</div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{c.email}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{c.phone}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-tabular text-emerald-600 dark:text-emerald-400">{c.totalDeposits > 0 ? formatCurrency(c.totalDeposits) : "—"}</span>
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
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
