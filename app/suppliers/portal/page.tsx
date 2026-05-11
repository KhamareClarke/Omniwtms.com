"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SupplierPortalIndexPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("supplierPortal");
      const parsed = raw ? (JSON.parse(raw) as { supplier_id?: unknown }) : null;
      const supplierId = typeof parsed?.supplier_id === "string" ? parsed.supplier_id : "";
      if (supplierId) {
        router.replace(`/suppliers/${supplierId}`);
        return;
      }
    } catch {
      // ignore and fall through
    }
    router.replace("/suppliers/portal/login");
  }, [router]);

  return <div className="p-8 text-sm text-muted-foreground">Redirecting…</div>;
}

