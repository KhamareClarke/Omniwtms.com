// @ts-nocheck
"use client";

import { ReactNode } from "react";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
