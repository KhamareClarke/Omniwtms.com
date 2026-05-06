"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Header from "./header";

/**
 * Wraps the site navbar with consistent structure and spacing.
 * UAE-style: full width, contained content, sticky/fixed as needed.
 */
export function NavbarWrapper({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <Header />
    </div>
  );
}
