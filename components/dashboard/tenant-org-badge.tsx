"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

/**
 * Shows organization name from tenant cookie (server-resolved).
 */
export function TenantOrgBadge() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/tenant-info", { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.organization_name) {
          setLabel(data.organization_name);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!label) return null;

  return (
    <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
      <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
      <span className="font-medium truncate max-w-[200px]">{label}</span>
    </div>
  );
}
