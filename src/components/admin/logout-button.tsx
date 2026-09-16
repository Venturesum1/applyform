"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "x-csrf-token": getCsrfTokenFromCookie() ?? "" },
      });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
      <LogOut className="size-4" />
      Logout
    </Button>
  );
}
