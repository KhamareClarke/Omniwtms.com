"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Header from "./header";
import Footer from "./footer";

/**
 * UAE-style page layout: Navbar → Page header/hero (slot) → Main content → Footer.
 * Use for all marketing/content pages. Keeps structure consistent.
 */
export function PageLayout({
  className,
  children,
  showFooter = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showFooter?: boolean }) {
  return (
    <div
      className={cn("min-h-screen bg-white flex flex-col", className)}
      {...props}
    >
      <Header />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
