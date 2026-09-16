import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/30">
      <AdminHeader email={session.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
