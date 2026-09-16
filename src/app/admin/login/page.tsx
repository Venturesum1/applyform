import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  const session = await requireAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin Sign In</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to review candidate applications.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
