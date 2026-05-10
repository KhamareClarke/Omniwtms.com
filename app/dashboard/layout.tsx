// @ts-nocheck
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { AIChatWidget } from "@/components/ui/ai-chat-widget";
import { getCurrentRole, getRedirectForWrongRole, clearAllRoleStorage } from "@/lib/auth/role-guard";
import { TenantOrgBadge } from "@/components/dashboard/tenant-org-badge";
import { supabase } from "@/lib/auth/SupabaseClient";
import { WhiteLabelLayout } from "@/components/layout/WhiteLabelLayout";
import type { PublicTenantBranding } from "@/lib/tenants/branding-types";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [wlBranding, setWlBranding] = useState<PublicTenantBranding | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const h = typeof window !== "undefined" ? window.location.hostname : "";
    if (!h) return;
    fetch(`/api/public/tenant-branding?host=${encodeURIComponent(h)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.tenant_id && d?.name) setWlBranding(d as PublicTenantBranding);
      })
      .catch(() => {});
  }, []);

  const checkAuth = () => {
    const role = getCurrentRole();
    const redirect = getRedirectForWrongRole("/dashboard");
    if (redirect) {
      toast.info("Redirecting to your portal");
      router.push(redirect);
      setIsLoading(false);
      return;
    }
    const user = localStorage.getItem("currentUser");
    if (!user) {
      toast.error("Please sign in to access the dashboard");
      router.push("/auth/login");
      setIsLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.type === "admin") {
        setIsLoading(false);
        router.replace("/admin");
        return;
      }
      if (!userData.email) {
        toast.error("Invalid user data. Please sign in again");
        handleLogout();
        return;
      }
      if (userData.type === "client" && userData.id) {
        fetch("/api/auth/sync-tenant", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: userData.id }),
        }).catch(() => {});
      }
      setUsername(userData.email.split("@")[0]);
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Session error. Please sign in again");
      handleLogout();
      return;
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    let isAdminUser = false;
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const d = JSON.parse(raw);
        isAdminUser = d.type === "admin";
      }
    } catch {
      /* ignore */
    }
    await fetch("/api/auth/admin/session", {
      method: "DELETE",
      credentials: "include",
    }).catch(() => {});
    await fetch("/api/auth/sync-tenant", { method: "DELETE", credentials: "include" }).catch(() => {});
    await supabase.auth.signOut().catch(() => {});
    clearAllRoleStorage();
    router.push(isAdminUser ? "/auth/admin" : "/auth/login");
  };

  // Show nothing while checking authentication
  if (isLoading) {
    return null;
  }

  return (
    <WhiteLabelLayout branding={wlBranding} variant="app" className="min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row h-screen flex-1">
        {/* No sidebar for admin */}
        {!isAdmin && <Sidebar className="h-screen" branding={wlBranding} />}

        {/* Main Content */}
        <div className={`flex-1 overflow-y-auto flex flex-col ${isAdmin ? "p-4 md:p-6" : "p-4 md:p-8 md:ml-0"}`}>
          {!isAdmin && (
            <div className="flex justify-end items-center gap-3 mb-4 shrink-0 flex-wrap">
              {wlBranding?.name && (
                <span className="text-sm font-medium text-gray-700 mr-auto truncate max-w-[50%]">
                  {wlBranding.name}
                </span>
              )}
              <TenantOrgBadge />
            </div>
          )}
          <div className="flex-1 min-h-0">{children}</div>
        </div>

        {/* No AI Chat Widget for admin */}
        {!isAdmin && <AIChatWidget />}
      </div>
    </WhiteLabelLayout>
  );
}
