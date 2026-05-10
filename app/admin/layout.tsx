"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, ClipboardList, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Organizations", icon: Building2 },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ClipboardList },
];

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/admin/session", { credentials: "include" });
        if (!res.ok) {
          router.replace("/auth/admin");
          return;
        }
        if (!cancelled) setReady(true);
      } catch {
        router.replace("/auth/admin");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/admin/session", { method: "DELETE", credentials: "include" }).catch(() => {});
    try {
      localStorage.removeItem("currentUser");
    } catch {
      /* ignore */
    }
    toast.success("Signed out");
    router.push("/auth/admin");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <p>Verifying admin session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside
        className={cn(
          "md:w-56 border-b md:border-b-0 md:border-r border-slate-200 bg-white md:min-h-screen shrink-0",
          mobileOpen ? "block" : "hidden md:block"
        )}
      >
        <div className="p-4 flex items-center justify-between md:block">
          <div className="font-semibold text-slate-900">Platform admin</div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="px-2 pb-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pb-4 hidden md:block">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-3 border-b border-slate-200 bg-white">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-slate-800">OmniWTMS Admin</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Out
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
