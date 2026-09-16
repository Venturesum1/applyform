"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatsCards } from "./stats-cards";
import { StatusBadge } from "./status-badge";
import { APPLICATION_STATUSES, type ApplicationStatus, type ApplicationSummary, type DashboardStats } from "@/types/application";
import { APPLICATIONS_PAGE_SIZE } from "@/lib/constants";

interface ListResponse {
  items: ApplicationSummary[];
  total: number;
  page: number;
  pageSize: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialStatus = searchParams.get("status") ?? "all";
  const initialPage = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(initialPage);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUrl = useCallback(
    (next: { q: string; status: string; page: number }) => {
      const params = new URLSearchParams();
      if (next.q) params.set("q", next.q);
      if (next.status !== "all") params.set("status", next.status);
      if (next.page > 1) params.set("page", String(next.page));
      const qs = params.toString();
      router.replace(qs ? `/admin?${qs}` : "/admin");
    },
    [router],
  );

  // Debounce the free-text search before it triggers a fetch.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    updateUrl({ q: query, status, page });
  }, [query, status, page, updateUrl]);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      const response = await fetch("/api/admin/stats");
      if (!response.ok || cancelled) return;
      const body = (await response.json()) as DashboardStats;
      if (!cancelled) setStats(body);
    }
    void fetchStats();
    return () => {
      cancelled = true;
    };
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    async function fetchApplications() {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status !== "all") params.set("status", status);
      params.set("page", String(page));

      const response = await fetch(`/api/admin/applications?${params.toString()}`);
      if (!response.ok || cancelled) {
        setIsLoading(false);
        return;
      }
      const body = (await response.json()) as ListResponse;
      if (!cancelled) {
        setData(body);
        setIsLoading(false);
      }
    }
    void fetchApplications();
    return () => {
      cancelled = true;
    };
  }, [query, status, page]);

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / APPLICATIONS_PAGE_SIZE)) : 1),
    [data],
  );

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email"
              className="pl-8"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Primary Skills</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No candidates found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                data?.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/applications/${item.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">{item.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.email}</TableCell>
                    <TableCell className="text-muted-foreground">{item.totalExperience || "—"}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {item.primarySkills || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status as ApplicationStatus} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} candidate${data.total === 1 ? "" : "s"}` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
