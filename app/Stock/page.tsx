// @ts-nocheck
"use client";

import { Suspense } from "react";
import { StockContent } from "@/components/inventory/inventory-management";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function StockPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StockContent />
    </Suspense>
  );
}
