import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types/application";

const CARDS: { key: keyof DashboardStats; label: string }[] = [
  { key: "total", label: "Total Applications" },
  { key: "New", label: "New" },
  { key: "Reviewing", label: "Reviewing" },
  { key: "Shortlisted", label: "Shortlisted" },
  { key: "Interview", label: "Interview" },
  { key: "Hired", label: "Hired" },
];

export function StatsCards({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {CARDS.map(({ key, label }) => (
        <Card key={key}>
          <CardContent className="px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {stats ? stats[key] : "—"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
