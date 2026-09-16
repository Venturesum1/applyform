import { Suspense } from "react";
import { Dashboard } from "@/components/admin/dashboard";

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
