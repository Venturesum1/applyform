import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function AdminHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/admin" className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">Recruiter Dashboard</span>
          <span className="text-xs text-muted-foreground">Candidate Applications</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
