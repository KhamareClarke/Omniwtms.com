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

  useEffect(() => {
    checkAuth();
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
      setIsAdmin(userData.type === "admin");
      if (!userData.email) {
        toast.error("Invalid user data. Please sign in again");
        handleLogout();
        return;
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

  const handleLogout = () => {
    clearAllRoleStorage();
    router.push("/auth/login");
  };

  // Show nothing while checking authentication
  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row h-screen">
        {/* No sidebar for admin */}
        {!isAdmin && <Sidebar className="h-screen" />}

        {/* Main Content */}
        <div className={`flex-1 overflow-y-auto ${isAdmin ? "p-4 md:p-6" : "p-4 md:p-8 md:ml-0"}`}>
          {children}
        </div>

        {/* No AI Chat Widget for admin */}
        {!isAdmin && <AIChatWidget />}
      </div>
    </div>
  );
}
