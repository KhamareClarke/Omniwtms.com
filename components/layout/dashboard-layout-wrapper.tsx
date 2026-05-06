"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dashboard page layout: max-width from design tokens, consistent padding.
 * Use for dashboard pages (wide container 1400px).
 */
export function DashboardLayoutWrapper({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50",
        "mx-auto w-full max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
