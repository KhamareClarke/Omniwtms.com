"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Vertical padding: default (64px), sm (48px), lg (80px) */
  size?: "default" | "sm" | "lg";
  as?: "section" | "div";
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, size = "default", as: As = "section", ...props }, ref) => {
    const paddingMap = {
      default: "py-[var(--section-py)]",
      sm: "py-[var(--section-py-sm)]",
      lg: "py-[var(--section-py-lg)]",
    };
    return (
      <As
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(paddingMap[size], className)}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      />
    );
  }
);
Section.displayName = "Section";

export { Section };
